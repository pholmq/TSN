import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useStore, usePlotStore, useSettingsStore } from "../store";
import { useEphemeridesStore } from "./Menus/ephemeridesStore";
import {
  posToDate,
  posToTime,
  dateTimeToPos,
  sDay,
} from "../utils/time-date-functions";
import { getRaDecDistance } from "../utils/celestial-functions";

// Simulation logic (updates the actual 3D objects temporarily)
function moveModel(plotObjects, plotPos) {
  // Convert simulation 'pos' (years) to 'days'
  const days = plotPos / sDay;

  plotObjects.forEach((pObj) => {
    if (pObj.orbitRef && pObj.orbitRef.current) {
      // Calculate angle in degrees: Start + (Speed * Days)
      const currentAngleDeg =
        parseFloat(pObj.startPos) + parseFloat(pObj.speed) * days;
      // Convert to Radians
      const currentAngleRad = currentAngleDeg * (Math.PI / 180);

      // Apply rotation
      pObj.orbitRef.current.rotation.y = currentAngleRad;

      // Force world matrix update immediately so getRaDecDistance sees the change
      pObj.orbitRef.current.updateMatrixWorld(true);
    }
  });
}

const EphController = () => {
  const { scene } = useThree(); // Direct access to the scene
  const { posRef } = useStore();
  const plotObjects = usePlotStore((s) => s.plotObjects);

  // Connect to our custom store
  const { trigger, params, resetTrigger } = useEphemeridesStore();

  // Use a ref to access plotObjects inside the effect without dependency issues
  const plotObjectsRef = useRef(plotObjects);
  useEffect(() => {
    plotObjectsRef.current = plotObjects;
  }, [plotObjects]);

  useEffect(() => {
    if (trigger && params) {
      generateEphemerides(params);
      resetTrigger();
    }
  }, [trigger, params, resetTrigger]);

  const generateEphemerides = ({
    startDate,
    endDate,
    stepSize,
    stepFactor,
    checkedPlanets,
  }) => {
    console.log("--- Starting Ephemerides Generation (Canvas Controller) ---");

    const currentPlotObjects = plotObjectsRef.current;
    if (!currentPlotObjects || currentPlotObjects.length === 0) {
      console.warn("Plot objects not ready.");
      return;
    }

    const startPos = dateTimeToPos(startDate, "12:00:00");
    const endPos = dateTimeToPos(endDate, "12:00:00");
    const increment = stepSize * stepFactor;

    const ephemeridesData = {};
    checkedPlanets.forEach((planet) => {
      ephemeridesData[planet] = [];
    });

    // 1. Remember original position to restore later
    const originalPos = posRef.current;

    let currentPos = startPos;
    let steps = 0;
    const MAX_STEPS = 50000;

    try {
      // Loop through time
      while (currentPos <= endPos && steps < MAX_STEPS) {
        // A. Move the simulation
        moveModel(currentPlotObjects, currentPos);

        const currentDate = posToDate(currentPos);
        const currentTime = posToTime(currentPos);

        // B. Calculate positions for each planet
        checkedPlanets.forEach((name) => {
          // Now usage of scene.getObjectByName inside this function will work correctly
          // because we are in the same context and have forced matrix updates.
          const data = getRaDecDistance(name, scene);

          ephemeridesData[name].push({
            date: currentDate,
            time: currentTime,
            ra: data.ra,
            dec: data.dec,
            dist: data.dist,
          });
        });

        currentPos += increment;
        steps++;
      }
    } catch (err) {
      console.error("Error generating ephemerides:", err);
    } finally {
      // 2. Restore the simulation to the visual time
      moveModel(currentPlotObjects, originalPos);
    }

    console.log(`Generation Complete. Steps: ${steps}`);
    console.log("Ephemerides Data:", ephemeridesData);
  };

  return null; // This component renders nothing visually
};

export default EphController;
