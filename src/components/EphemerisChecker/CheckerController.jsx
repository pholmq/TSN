import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePlotStore, useSettingsStore } from "../../store";
import {
  useCheckerStore,
  raToDeg,
  decToDeg,
  parseDistanceToAU,
} from "./checkerStore";
import { dateTimeToPos } from "../../utils/time-date-functions";
import {
  movePlotModel,
  getPlotModelRaDecDistance,
} from "../../utils/plotModelFunctions";

const CheckerController = () => {
  const { invalidate, scene } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const settings = useSettingsStore((s) => s.settings);

  const {
    showChecker,
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

  // 1. Debounced Trigger: Watch settings, but ONLY if the menu is open
  useEffect(() => {
    if (!showChecker) {
      setChecking(false);
      setIsChecking(false);
      return;
    }

    if (parsedData) {
      setChecking(false);
      setIsChecking(false);

      const timer = setTimeout(() => {
        setTriggerCheck(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [settings, parsedData, setTriggerCheck, setIsChecking, showChecker]);

  // 2. Setup checking job
  useEffect(() => {
    if (triggerCheck && parsedData && showChecker) {
      setIsChecking(true);
      setProgress(0);

      const planets = Object.keys(parsedData);
      let totalRows = 0;
      const initialDeviations = {};

      planets.forEach((p) => {
        totalRows += parsedData[p].length;
        initialDeviations[p] = {
          maxRaDev: 0,
          maxDecDev: 0,
          maxDistDev: 0,
          maxElongDev: 0,
        };
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
  }, [
    triggerCheck,
    parsedData,
    setIsChecking,
    setProgress,
    setTriggerCheck,
    showChecker,
  ]);

  // 3. Process loop
  useFrame(() => {
    if (!checking || !parsedData || !showChecker) return;

    invalidate();

    const job = jobRef.current;
    const BATCH_SIZE = 50;
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

        movePlotModel(plotObjects, pos);
        // Ensure scene is passed correctly to match your getPlotModelRaDecDistance signature if needed
        const data = getPlotModelRaDecDistance(planetName, plotObjects, scene);

        if (!data) return;

        const modelRaDeg = raToDeg(data.ra);
        const modelDecDeg = decToDeg(data.dec);
        const modelDistAU = parseDistanceToAU(data.dist);
        const modelElongDeg = parseFloat(data.elongation) || 0;

        // 1. RA
        let raDiff = Math.abs(row.raDeg - modelRaDeg);
        if (raDiff > 180) raDiff = 360 - raDiff;
        if (raDiff > job.deviations[planetName].maxRaDev)
          job.deviations[planetName].maxRaDev = raDiff;

        // 2. Dec
        const decDiff = Math.abs(row.decDeg - modelDecDeg);
        if (decDiff > job.deviations[planetName].maxDecDev)
          job.deviations[planetName].maxDecDev = decDiff;

        // 3. Distance
        if (row.distAU !== null) {
          const distDiff = Math.abs(row.distAU - modelDistAU);
          if (distDiff > job.deviations[planetName].maxDistDev)
            job.deviations[planetName].maxDistDev = distDiff;
        }

        // 4. Elongation
        if (row.elongDeg !== null) {
          const elongDiff = Math.abs(row.elongDeg - modelElongDeg);
          if (elongDiff > job.deviations[planetName].maxElongDev)
            job.deviations[planetName].maxElongDev = elongDiff;
        }

        job.currentRowIdx++;
        job.processedRows++;
        batchCount++;
      } else {
        job.currentPlanetIdx++;
        job.currentRowIdx = 0;
      }
    }

    setProgress(
      Math.floor((job.processedRows / Math.max(1, job.totalRows)) * 100)
    );

    if (job.currentPlanetIdx >= job.planets.length) {
      setResults({ ...job.deviations });
      setChecking(false);
      setIsChecking(false);
    }
  });

  return null;
};

export default CheckerController;
