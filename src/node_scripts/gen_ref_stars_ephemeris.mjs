import fs from "fs";
import * as THREE from "three";

// 1. SIMBAD TAP REST API Query (ADQL format)
const SIMBAD_TAP_URL = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const query = `
  SELECT basic.MAIN_ID, ra, dec, pmra, pmdec, plx_value
  FROM basic
  WHERE basic.MAIN_ID IN ('* alf UMi', '* alf CMa', '* alf Lyr', '* del Ori')
`;

// Map SIMBAD IDs to BSC Common Names and HIP Numbers
const NAME_MAP = {
  "* alf UMi": "Polaris HIP 11767",
  "* alf CMa": "Sirius HIP 32349",
  "* alf Lyr": "Vega HIP 91262",
  "* del Ori": "Mintaka HIP 25930",
};

// Helper: Convert degrees to radians
const degToRad = (deg) => deg * (Math.PI / 180);
const radToDeg = (rad) => rad * (180 / Math.PI);

// Helper: Convert spherical RA/Dec to Cartesian Vector3
function sphericalToCartesian(raDeg, decDeg) {
  const raRad = degToRad(raDeg);
  const decRad = degToRad(decDeg);
  return new THREE.Vector3(
    Math.cos(decRad) * Math.cos(raRad),
    Math.cos(decRad) * Math.sin(raRad),
    Math.sin(decRad)
  );
}

// Helper: Convert Cartesian Vector3 back to Spherical RA/Dec (Degrees)
function cartesianToSpherical(vector) {
  const decRad = Math.asin(vector.z);
  const raRad = Math.atan2(vector.y, vector.x);

  let raDeg = radToDeg(raRad);
  let decDeg = radToDeg(decRad);

  if (raDeg < 0) raDeg += 360;

  return { raDeg, decDeg };
}

// Helper: Format RA (Degrees) to BSC String format ("HHh MMm SS.Ss")
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

// Helper: Format Dec (Degrees) to BSC String format ("±DD° MM′ SS″")
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

// Rigorous IAU Precession Matrix Generator (J2000 to Target Epoch)
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
  console.log("Querying SIMBAD database...");

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
  const stars = simbadData.data;

  const years = [];
  for (let y = 1900; y <= 2100; y += 10) years.push(y);

  const outputData = [];

  stars.forEach((star) => {
    const rawName = star[0].trim();
    // Apply mapping or fallback to clean raw name
    const formattedName = NAME_MAP[rawName] || rawName.replace("* ", "");

    const raJ2000 = star[1];
    const decJ2000 = star[2];

    const pmRaDegPerYr = star[3] / 3600000 / Math.cos(degToRad(decJ2000));
    const pmDecDegPerYr = star[4] / 3600000;

    // THE FIX: Convert SIMBAD parallax (mas) to Distance (Parsecs)
    const parallaxMas = star[5];
    const distanceParsecs = 1000 / parallaxMas;

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
        P: distanceParsecs, // Now matches BSC.json standard
      });
    });
  });

  fs.writeFileSync(
    "./reference_stars.json",
    JSON.stringify(outputData, null, 2)
  );
  console.log(`Saved ${outputData.length} data points to reference_stars.json`);
}

generateEphemeris();
