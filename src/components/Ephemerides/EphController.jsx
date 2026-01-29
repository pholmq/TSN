import { useEffect, useState, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { usePlotStore } from "../../store";
import { useEphemeridesStore } from "./ephemeridesStore";
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

  const {
    trigger,
    params,
    resetTrigger,
    setGeneratedData,
    setGenerationError,
    setIsGenerating, // Import the new setter
  } = useEphemeridesStore();

  const [generating, setGenerating] = useState(false);

  const jobRef = useRef({
    currentPos: 0,
    endPos: 0,
    increment: 0,
    checkedPlanets: [],
    data: {},
    totalSteps: 0,
    currentStepCount: 0,
  });

  // 1. Initialize Job
  useEffect(() => {
    if (trigger && params) {
      // Ensure global loading state is true
      setIsGenerating(true);

      const startPos = dateTimeToPos(params.startDate, "00:00:00");
      const endPos = dateTimeToPos(params.endDate, "00:00:00");
      const increment = params.stepSize * params.stepFactor;

      // --- Pre-calculation Validation ---
      const calculatedSteps = Math.floor((endPos - startPos) / increment) + 1;
      const totalOperations = calculatedSteps * params.checkedPlanets.length;

      // Check limit
      if (totalOperations > 100000) {
        const errorMsg =
          `Total Steps: ${calculatedSteps}\n` +
          `Selected Planets: ${params.checkedPlanets.length}\n` +
          `Total Operations: ${totalOperations}\n\n` +
          `The limit is 100,000 operations. Please reduce the Date Range, increase the Step Size, or select fewer planets.`;

        setGenerationError(errorMsg);
        setIsGenerating(false); // Stop loading on error
        resetTrigger();
        return;
      }

      // Initialize Data Structure
      const initialData = {};
      params.checkedPlanets.forEach((planet) => {
        initialData[planet] = [];
      });

      // Setup Job
      jobRef.current = {
        currentPos: startPos,
        endPos: endPos,
        increment: increment,
        checkedPlanets: params.checkedPlanets,
        data: initialData,
        totalSteps: calculatedSteps,
        currentStepCount: 0,
      };

      setGenerating(true);
      resetTrigger();
    }
  }, [trigger, params, resetTrigger, setGenerationError, setIsGenerating]);

  // 2. Process Job in Chunks
  useFrame(() => {
    if (!generating) return;

    const job = jobRef.current;
    const BATCH_SIZE = 50;

    let batchCount = 0;

    while (job.currentPos <= job.endPos && batchCount < BATCH_SIZE) {
      const currentDate = posToDate(job.currentPos);
      const currentTime = posToTime(job.currentPos);

      movePlotModel(plotObjects, job.currentPos);

      job.checkedPlanets.forEach((name) => {
        const data = getPlotModelRaDecDistance(name, plotObjects, scene);
        if (data) {
          job.data[name].push({
            date: currentDate,
            time: currentTime,
            ra: data.ra,
            dec: data.dec,
            dist: data.dist,
            elong: data.elongation,
          });
        }
      });

      job.currentPos += job.increment;
      job.currentStepCount++;
      batchCount++;
    }

    // Check if finished
    if (job.currentPos > job.endPos) {
      console.log(`Generation Complete. Steps: ${job.currentStepCount}`);
      setGeneratedData(job.data); // This also sets isGenerating to false in the store
      setGenerating(false);
    }
  });

  return null;
};
export default EphController;
