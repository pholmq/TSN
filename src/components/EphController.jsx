import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { useStore, usePlotStore, useSettingsStore } from "../store";
import { useEphemeridesStore } from "./Menus/ephemeridesStore";
import useFrameInterval from "../utils/useFrameInterval";
import {
  posToDate,
  posToTime,
  dateTimeToPos,
  sDay,
} from "../utils/time-date-functions";
import {
  movePlotModel,
  getPlotModelRaDecDistance,
} from "../utils/plotModelFunctions";

// --- Helper function to save file ---
const saveEphemeridesAsText = (data, params) => {
  let output = "--- EPHEMERIDES REPORT ---\n";
  output += `Generated on: ${new Date().toLocaleString()}\n`;
  output += `Start Date: ${params.startDate}\n`;
  output += `End Date: ${params.endDate}\n`;
  output += `Step Size: ${params.stepSize} ${params.stepFactor === 1 ? "Days" : "Years"}\n`;
  output += "--------------------------------------\n\n";

  Object.keys(data).forEach((planetName) => {
    output += `PLANET: ${planetName.toUpperCase()}\n`;
    // Table Header
    output += `${"Date".padEnd(12)} | ${"Time".padEnd(10)} | ${"RA".padEnd(12)} | ${"Dec".padEnd(12)} | ${"Dist".padEnd(12)} | ${"Elongation".padEnd(10)}\n`;
    output += "-".repeat(80) + "\n";

    // Table Rows
    data[planetName].forEach((row) => {
      output += `${row.date.padEnd(12)} | ${row.time.padEnd(10)} | ${row.ra.padEnd(12)} | ${row.dec.padEnd(12)} | ${row.dist.padEnd(12)} | ${row.elong}\n`;
    });
    output += "\n" + "=".repeat(80) + "\n\n";
  });

  // Create Blob
  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  // Generate Filename from Start and End Dates
  // We replace potential unsafe characters just in case, though standard YYYY-MM-DD is usually safe
  const safeStart = params.startDate.replace(/[:/]/g, "-");
  const safeEnd = params.endDate.replace(/[:/]/g, "-");
  const filename = `Ephemerides_${safeStart}_to_${safeEnd}.txt`;

  // Trigger Download
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const EphController = () => {
  const { scene } = useThree(); 
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const { trigger, params, resetTrigger } = useEphemeridesStore();

  const [done, setDone] = useState(true);

  useEffect(() => {
    if (trigger && params) {
      const startPos = dateTimeToPos(params.startDate, "12:00:00");
      const endPos = dateTimeToPos(params.endDate, "12:00:00");
      if (params.checkedPlanets.length > 0 && startPos <= endPos) {
        setDone(false);
      }
      resetTrigger();
    }
  }, [trigger, params, resetTrigger]);

  useFrameInterval(() => {
    if (done) return;

    const { startDate, endDate, stepSize, stepFactor, checkedPlanets } = params;

    const startPos = dateTimeToPos(startDate, "12:00:00");
    const endPos = dateTimeToPos(endDate, "12:00:00");
    const increment = stepSize * stepFactor;

    const ephemeridesData = {};
    checkedPlanets.forEach((planet) => {
      ephemeridesData[planet] = [];
    });

    let currentPos = startPos;
    let steps = 0;
    const MAX_STEPS = 50000;

    // console.log("--- Starting Ephemerides Generation ---");

    while (currentPos <= endPos && steps < MAX_STEPS) {
      const currentDate = posToDate(currentPos);
      const currentTime = posToTime(currentPos);
      
      movePlotModel(plotObjects, currentPos);

      checkedPlanets.forEach((name) => {
        const data = getPlotModelRaDecDistance(name, plotObjects, scene);

        if (data) {
          ephemeridesData[name].push({
            date: currentDate,
            time: currentTime,
            ra: data.ra,
            dec: data.dec,
            dist: data.dist,
            elong: data.elongation,
          });
        }
      });

      currentPos += increment;
      steps++;
    }
    setDone(true);

    // console.log(`Generation Complete. Steps: ${steps}`);
    
    // Trigger the save file dialog with the new naming convention
    saveEphemeridesAsText(ephemeridesData, params);
  });

  return null;
};
export default EphController;