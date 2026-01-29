import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { usePlotStore } from "../../store";
import { useEphemeridesStore } from "./ephemeridesStore";
import useFrameInterval from "../../utils/useFrameInterval";
import {
  posToDate,
  posToTime,
  dateTimeToPos,
} from "../../utils/time-date-functions";
import {
  movePlotModel,
  getPlotModelRaDecDistance,
} from "../../utils/plotModelFunctions";

const EphController = () => {
  const { scene } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);

  // Destructure the new actions
  const {
    trigger,
    params,
    resetTrigger,
    setGeneratedData,
    setGenerationError,
  } = useEphemeridesStore();

  const [done, setDone] = useState(true);

  useEffect(() => {
    if (trigger && params) {
      const startPos = dateTimeToPos(params.startDate, "00:00:00");
      const endPos = dateTimeToPos(params.endDate, "00:00:00");
      if (params.checkedPlanets.length > 0 && startPos <= endPos) {
        setDone(false);
      }
      resetTrigger();
    }
  }, [trigger, params, resetTrigger]);

  useFrameInterval(() => {
    if (done) return;

    const { startDate, endDate, stepSize, stepFactor, checkedPlanets } = params;

    const startPos = dateTimeToPos(startDate, "00:00:00");
    const endPos = dateTimeToPos(endDate, "00:00:00");
    const increment = stepSize * stepFactor;

    // --- Pre-calculation Validation ---
    const calculatedSteps = Math.floor((endPos - startPos) / increment) + 1;
    const totalOperations = calculatedSteps * checkedPlanets.length;

    // Check limit
    if (totalOperations > 100000) {
      const errorMsg =
        `Total Steps: ${calculatedSteps}\n` +
        `Selected Planets: ${checkedPlanets.length}\n` +
        `Total Operations: ${totalOperations}\n\n` +
        `The limit is 100,000 operations. Please reduce the Date Range, increase the Step Size, or select fewer planets.`;

      setGenerationError(errorMsg);
      setDone(true);
      return;
    }

    const ephemeridesData = {};
    checkedPlanets.forEach((planet) => {
      ephemeridesData[planet] = [];
    });

    let currentPos = startPos;
    let steps = 0;

    // Safety break (just in case loop logic fails)
    const MAX_SAFETY_BREAK = 200000;

    while (currentPos <= endPos && steps < MAX_SAFETY_BREAK) {
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

    console.log(`Generation Complete. Actual Steps: ${steps}`);

    // Instead of saving, send data to the Store to open the Popup
    setGeneratedData(ephemeridesData);
  });

  return null;
};
export default EphController;
