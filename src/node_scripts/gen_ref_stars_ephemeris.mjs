import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as THREE from "three";

// Setup paths to dynamically read from/write to your settings folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load your local BSC.json to map HIP numbers to Common Names
const bscPath = path.join(__dirname, "../settings/BSC.json");
const bscData = JSON.parse(fs.readFileSync(bscPath, "utf-8"));

const bscMap = {};
bscData.forEach((star) => {
  if (star.HIP) {
    bscMap[`HIP ${star.HIP}`] = star.N; // Example: "HIP 11767" -> "Polaris"
  }
});

// 2. SIMBAD TAP REST API Query (ADQL format)
const SIMBAD_TAP_URL = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";

// Query all Bayer designated stars and join their HIP number
const query = `
  SELECT basic.MAIN_ID, basic.ra, basic.dec, basic.pmra, basic.pmdec, basic.plx_value, ident.id
  FROM basic
  JOIN ident ON basic.oid = ident.oidref
  WHERE basic.MAIN_ID LIKE '* %'
    AND ident.id LIKE 'HIP %'
    AND basic.plx_value > 0
`;

// Helpers
const degToRad = (deg) => deg * (Math.PI / 180);
const radToDeg = (rad) => rad * (180 / Math.PI);

function sphericalToCartesian(raDeg, decDeg) {
  const raRad = degToRad(raDeg);
  const decRad = degToRad(decDeg);
  return new THREE.Vector3(
    Math.cos(decRad) * Math.cos(raRad),
    Math.cos(decRad) * Math.sin(raRad),
    Math.sin(decRad)
  );
}

function cartesianToSpherical(vector) {
  const decRad = Math.asin(vector.z);
  const raRad = Math.atan2(vector.y, vector.x);
  let raDeg = radToDeg(raRad);
  let decDeg = radToDeg(decRad);
  if (raDeg < 0) raDeg += 360;
  return { raDeg, decDeg };
}

function formatRA(raDeg) {
  const raHours = raDeg / 15;
  const h = Math.floor(raHours);
  const m = Math.floor((raHours - h) * 60);
  const s = (raHours - h - m / 60) * 3600;

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = s.toFixed(1).padStart(4, "0");
  return `${hh}h ${mm}m ${ss}s`;
}

function formatDec(decDeg) {
  const isNegative = decDeg < 0;
  const absDec = Math.abs(decDeg);

  const d = Math.floor(absDec);
  const m = Math.floor((absDec - d) * 60);
  const s = (absDec - d - m / 60) * 3600;

  const signStr = isNegative ? "-" : "+";
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(Math.round(s)).padStart(2, "0");
  return `${signStr}${dd}° ${mm}′ ${ss}″`;
}

function getPrecessionMatrix(targetYear) {
  const T = (targetYear - 2000.0) / 100.0;
  const zeta_A = 2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T;
  const z_A = 2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T;
  const theta_A = 2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T;

  const arcsecToRad = Math.PI / (180 * 3600);
  const zeta = zeta_A * arcsecToRad;
  const z = z_A * arcsecToRad;
  const theta = theta_A * arcsecToRad;

  const matrix = new THREE.Matrix4();
  const m1 = new THREE.Matrix4().makeRotationZ(-z);
  const m2 = new THREE.Matrix4().makeRotationY(theta);
  const m3 = new THREE.Matrix4().makeRotationZ(-zeta);

  matrix.multiplyMatrices(m1, m2).multiply(m3);
  return matrix;
}

async function generateEphemeris() {
  console.log("Querying SIMBAD database for bright stars...");

  const response = await fetch(SIMBAD_TAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      request: "doQuery",
      lang: "ADQL",
      format: "json",
      query: query,
    }),
  });

  const simbadData = await response.json();
  const allStars = simbadData.data;

  // 3. Grid the sky into 48 sectors (24h RA x North/South Dec)
  const bins = {};
  allStars.forEach((star) => {
    const ra = star[1];
    const dec = star[2];
    const pmra = star[3];
    const pmdec = star[4];
    const plx = star[5];

    if (pmra === null || pmdec === null || plx === null || plx <= 0) return;

    const raHour = Math.floor(ra / 15);
    const hemisphere = dec >= 0 ? "N" : "S";
    const binKey = `${raHour}-${hemisphere}`;

    if (!bins[binKey]) bins[binKey] = [];
    bins[binKey].push(star);
  });

  const targetStars = [];

  // 4. Find the single star with the LOWEST proper motion in each sector
  Object.keys(bins).forEach((key) => {
    bins[key].sort((a, b) => {
      const pmA = Math.sqrt(a[3] * a[3] + a[4] * a[4]);
      const pmB = Math.sqrt(b[3] * b[3] + b[4] * b[4]);
      return pmA - pmB;
    });
    targetStars.push(bins[key][0]);
  });

  console.log(
    `Isolated ${targetStars.length} spread-out anchor stars with minimal proper motion.`
  );

  const years = [];
  for (let y = 1900; y <= 2100; y += 10) years.push(y);

  const outputData = [];

  targetStars.forEach((star) => {
    const rawName = star[0].trim();
    const hipId = star[6].trim();

    // Cross-reference with your BSC.json for identical naming
    const commonName = bscMap[hipId];
    const formattedName = commonName
      ? `${commonName} / ${hipId}`
      : `${rawName.replace("* ", "")} / ${hipId}`;

    const raJ2000 = star[1];
    const decJ2000 = star[2];

    const pmRaDegPerYr = star[3] / 3600000 / Math.cos(degToRad(decJ2000));
    const pmDecDegPerYr = star[4] / 3600000;

    const parallaxMas = star[5];
    const distanceParsecs = 1000 / parallaxMas; // Convert Parallax to Parsecs

    years.forEach((year) => {
      const deltaYears = year - 2000.0;

      const currentRa = raJ2000 + pmRaDegPerYr * deltaYears;
      const currentDec = decJ2000 + pmDecDegPerYr * deltaYears;

      const vector = sphericalToCartesian(currentRa, currentDec);

      const precessionMatrix = getPrecessionMatrix(year);
      vector.applyMatrix4(precessionMatrix).normalize();

      const { raDeg, decDeg } = cartesianToSpherical(vector);

      outputData.push({
        name: formattedName,
        epoch: year,
        RA: formatRA(raDeg),
        Dec: formatDec(decDeg),
        P: distanceParsecs,
      });
    });
  });

  const outputPath = path.join(__dirname, "../settings/reference_stars.json");
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(
    `Saved ${outputData.length} total epoch points to reference_stars.json`
  );
}

generateEphemeris();
