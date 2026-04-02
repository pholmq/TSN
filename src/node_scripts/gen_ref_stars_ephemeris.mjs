import fs from "fs";
import * as THREE from "three";

// 1. SIMBAD TAP REST API Query (ADQL format)
const SIMBAD_TAP_URL = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
const query = `
  SELECT basic.MAIN_ID, ra, dec, pmra, pmdec, plx_value
  FROM basic
  WHERE basic.MAIN_ID IN ('* alf UMi', '* alf CMa', '* alf Lyr', '* del Ori')
`;

// Helper: Convert degrees to radians
const degToRad = (deg) => deg * (Math.PI / 180);

// Helper: Convert spherical RA/Dec to Cartesian Vector3
function sphericalToCartesian(raDeg, decDeg) {
  const raRad = degToRad(raDeg);
  const decRad = degToRad(decDeg);
  // Standard astronomical Cartesian (X points to RA=0, Dec=0; Z points to North Pole)
  return new THREE.Vector3(
    Math.cos(decRad) * Math.cos(raRad),
    Math.cos(decRad) * Math.sin(raRad),
    Math.sin(decRad)
  );
}

// Rigorous IAU Precession Matrix Generator (J2000 to Target Epoch)
function getPrecessionMatrix(targetYear) {
  // Centuries since J2000
  const T = (targetYear - 2000.0) / 100.0;

  // IAU 1976 Precession angles (in arcseconds)
  const zeta_A = 2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T;
  const z_A = 2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T;
  const theta_A = 2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T;

  // Convert arcseconds to radians
  const arcsecToRad = Math.PI / (180 * 3600);
  const zeta = zeta_A * arcsecToRad;
  const z = z_A * arcsecToRad;
  const theta = theta_A * arcsecToRad;

  // Apply sequential rotations: Rz(-z) * Ry(theta) * Rz(-zeta)
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
  // columns map to: [0]: ID, [1]: RA, [2]: DEC, [3]: PMRA, [4]: PMDEC, [5]: PLX

  const years = [];
  for (let y = 1900; y <= 2100; y += 10) years.push(y);

  const outputData = [];

  stars.forEach((star) => {
    const name = star[0].trim();
    const raJ2000 = star[1];
    const decJ2000 = star[2];

    // Proper motion is in milliarcseconds per year. Convert to degrees per year.
    const pmRaDegPerYr = star[3] / 3600000 / Math.cos(degToRad(decJ2000));
    const pmDecDegPerYr = star[4] / 3600000;

    years.forEach((year) => {
      const deltaYears = year - 2000.0;

      // 1. Apply Proper Motion (Linear drift over time)
      const currentRa = raJ2000 + pmRaDegPerYr * deltaYears;
      const currentDec = decJ2000 + pmDecDegPerYr * deltaYears;

      // 2. Convert to Cartesian
      const vector = sphericalToCartesian(currentRa, currentDec);

      // 3. Apply IAU Precession Rotation
      const precessionMatrix = getPrecessionMatrix(year);
      vector.applyMatrix4(precessionMatrix).normalize();

      outputData.push({
        name: name.replace("* ", ""), // Clean up SIMBAD formatting
        epoch: year,
        vector: { x: vector.x, y: vector.y, z: vector.z },
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
