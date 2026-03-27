import fs from "fs";

/**
 * Converts decimal degrees to HHh MMm SS.Ss and +DD° MM′ SS″
 */
function formatCoordinates(raDeg, decDeg) {
  const raHoursTotal = raDeg / 15;
  const raH = Math.floor(raHoursTotal);
  const raM = Math.floor((raHoursTotal - raH) * 60);
  const raS = ((raHoursTotal - raH - raM / 60) * 3600).toFixed(1);

  const decAbs = Math.abs(decDeg);
  const decSign = decDeg >= 0 ? "+" : "-";
  const decD = Math.floor(decAbs);
  const decM = Math.floor((decAbs - decD) * 60);
  const decS = Math.floor((decAbs - decD - decM / 60) * 3600);

  const raStr = `${String(raH).padStart(2, "0")}h ${String(raM).padStart(
    2,
    "0"
  )}m ${String(raS).padStart(4, "0")}s`;
  const decStr = `${decSign}${String(decD).padStart(2, "0")}° ${String(
    decM
  ).padStart(2, "0")}′ ${String(decS).padStart(2, "0")}″`;

  return { raStr, decStr };
}

function processCatalogs() {
  try {
    // 1. Load your BSC JSON
    const bscData = JSON.parse(fs.readFileSync("./BSC.json", "utf8"));

    // 2. Load the Hipparcos JS file
    const hipRaw = fs.readFileSync("./hipparcos_8.js", "utf8");

    // Evaluate the JS file content to bypass JSON.parse errors on empty array slots (,,)
    const getHipData = new Function(`
      let hipparcos_catalog;
      ${hipRaw}
      return hipparcos_catalog;
    `);
    const hipData = getHipData();

    // 3. Build a fast lookup map from the Hipparcos array
    // Index 0: HIP ID, Index 4: RA, Index 5: Dec
    const hipMap = new Map();
    hipData.forEach((row) => {
      if (!row || !row[0]) return;
      const hipId = String(row[0]);
      const raDeg = parseFloat(row[4]);
      const decDeg = parseFloat(row[5]);

      if (!isNaN(raDeg) && !isNaN(decDeg)) {
        hipMap.set(hipId, formatCoordinates(raDeg, decDeg));
      }
    });

    // 4. Update BSC data and isolate missing stars
    const updatedBsc = [];
    const missingStars = [];

    bscData.forEach((star) => {
      if (star.HIP && hipMap.has(star.HIP)) {
        const newCoords = hipMap.get(star.HIP);
        updatedBsc.push({
          ...star,
          RA: newCoords.raStr,
          Dec: newCoords.decStr,
        });
      } else {
        // Push to missing array if HIP is not found or star has no HIP ID
        missingStars.push(star);
      }
    });

    // 5. Write outputs
    fs.writeFileSync("./BSC_Updated.json", JSON.stringify(updatedBsc, null, 2));
    fs.writeFileSync(
      "./missing_stars.json",
      JSON.stringify(missingStars, null, 2)
    );

    console.log(`Success! Updated ${updatedBsc.length} stars.`);
    console.log(
      `Isolated ${missingStars.length} missing stars into 'missing_stars.json'.`
    );
  } catch (err) {
    console.error("Error processing catalogs:", err);
  }
}

processCatalogs();
