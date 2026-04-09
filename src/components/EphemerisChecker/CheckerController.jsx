import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePlotStore, useSettingsStore } from "../../store";
import { useCheckerStore } from "./checkerStore";
import { dateTimeToPos } from "../../utils/time-date-functions";
import {
  movePlotModel,
  getPlotModelRaDecDistance,
} from "../../utils/plotModelFunctions";
import { raToDeg, decToDeg } from "./checkerStore";

const CheckerController = () => {
  const { invalidate } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const settings = useSettingsStore((s) => s.settings);

  const {
    parsedData,
    triggerCheck,
    setTriggerCheck,
    setIsChecking,
    setProgress,
    setResults,
  } = useCheckerStore();

  const [checking, setChecking] = useState(false);

  const jobRef = useRef({
    planets: [],
    currentPlanetIdx: 0,
    currentRowIdx: 0,
    deviations: {},
    totalRows: 0,
    processedRows: 0,
  });

  // Re-trigger check automatically if settings change while data is loaded
  useEffect(() => {
    if (parsedData) {
      setTriggerCheck(true);
    }
  }, [settings, parsedData, setTriggerCheck]);

  useEffect(() => {
    if (triggerCheck && parsedData) {
      setIsChecking(true);
      setProgress(0);

      const planets = Object.keys(parsedData);
      let totalRows = 0;
      const initialDeviations = {};

      planets.forEach((p) => {
        totalRows += parsedData[p].length;
        initialDeviations[p] = { maxRaDev: 0, maxDecDev: 0 };
      });

      jobRef.current = {
        planets,
        currentPlanetIdx: 0,
        currentRowIdx: 0,
        deviations: initialDeviations,
        totalRows,
        processedRows: 0,
      };

      setChecking(true);
      setTriggerCheck(false);
    }
  }, [triggerCheck, parsedData, setIsChecking, setProgress, setTriggerCheck]);

  useFrame(() => {
    if (!checking) return;

    // Force render while processing
    invalidate();

    const job = jobRef.current;
    const BATCH_SIZE = 30; // Performant chunk size
    let batchCount = 0;

    while (
      batchCount < BATCH_SIZE &&
      job.currentPlanetIdx < job.planets.length
    ) {
      const planetName = job.planets[job.currentPlanetIdx];
      const rows = parsedData[planetName];

      if (job.currentRowIdx < rows.length) {
        const row = rows[job.currentRowIdx];
        const pos = dateTimeToPos(row.date, row.time);

        // Move model and measure
        movePlotModel(plotObjects, pos);
        const data = getPlotModelRaDecDistance(planetName, plotObjects);

        if (data) {
          const modelRaDeg = raToDeg(data.ra);
          const modelDecDeg = decToDeg(data.dec);

          // Compute shortest distance on circle for RA (0-360)
          let raDiff = Math.abs(row.raDeg - modelRaDeg);
          if (raDiff > 180) raDiff = 360 - raDiff;

          const decDiff = Math.abs(row.decDeg - modelDecDeg);

          if (raDiff > job.deviations[planetName].maxRaDev) {
            job.deviations[planetName].maxRaDev = raDiff;
          }
          if (decDiff > job.deviations[planetName].maxDecDev) {
            job.deviations[planetName].maxDecDev = decDiff;
          }
        }

        job.currentRowIdx++;
        job.processedRows++;
        batchCount++;
      } else {
        // Move to next planet
        job.currentPlanetIdx++;
        job.currentRowIdx = 0;
      }
    }

    setProgress(
      Math.floor((job.processedRows / Math.max(1, job.totalRows)) * 100)
    );

    if (job.currentPlanetIdx >= job.planets.length) {
      setResults(job.deviations);
      setChecking(false);
      setIsChecking(false);
    }
  });

  return null;
};

export default CheckerController;
