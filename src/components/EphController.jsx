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
import { getRaDecDistance } from "../utils/celestial-functions";
import {
  movePlotModel,
  getPlotModelRaDecDistance,
} from "../utils/plotModelFunctions";

const EphController = () => {
  const { scene } = useThree(); // Direct access to the scene
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const { trigger, params, resetTrigger } = useEphemeridesStore();

  const [done, setDone] = useState(true);

  useEffect(() => {
    if (trigger && params) {
      if (params.checkedPlanets) {
        setDone(false);
      }
      resetTrigger();
    }
  }, [trigger]);

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

    console.log("--- Starting Ephemerides Generation ---");

    // Loop through time
    while (currentPos <= endPos && steps < MAX_STEPS) {
      const currentDate = posToDate(currentPos);
      const currentTime = posToTime(currentPos);
      // Move the plot model
      movePlotModel(plotObjects, currentPos);

      // Calculate positions for each planet
      checkedPlanets.forEach((name) => {
        // const plotObj = plotObjects.find((p) => p.name === name);

        // plotObj.pivotRef.current.getWorldPosition(objectPos);

        const data = getPlotModelRaDecDistance(name, plotObjects, scene);

        ephemeridesData[name].push({
          date: currentDate,
          time: currentTime,
          ra: data.ra,
          dec: data.dec,
          dist: data.dist,
          elong: data.elongation,
        });
      });

      currentPos += increment;
      steps++;
    }
    setDone(true);

    console.log(`Generation Complete. Steps: ${steps}`);
    console.log("Ephemerides Data:", ephemeridesData);
  });

  return null;
};
export default EphController;
