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
  const { scene, invalidate } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const {
    trigger,
    params,
    resetTrigger,
    setGeneratedData,
    setGenerationError,
    setIsGenerating,
    setProgress,
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
    lastProgress: 0,
  });

  // 1. Initialize Job
  useEffect(() => {
    if (trigger && params) {
      setIsGenerating(true);
      setProgress(0);

      const startPos = dateTimeToPos(params.startDate, "00:00:00");
      const endPos = dateTimeToPos(params.endDate, "00:00:00");
      const increment = params.stepSize * params.stepFactor;

      const calculatedSteps = Math.floor((endPos - startPos) / increment) + 1;

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
        lastProgress: 0,
      };

      setGenerating(true);
      resetTrigger();
    }
  }, [
    trigger,
    params,
    resetTrigger,
    setGenerationError,
    setIsGenerating,
    setProgress,
  ]);

  // 2. Process Job in Chunks
  useFrame(() => {
    // Check for Cancellation
    if (generating && !useEphemeridesStore.getState().isGenerating) {
      // console.log("Generation Cancelled by User");
      setGenerating(false);
      return;
    }

    if (!generating) return;

    invalidate();

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

    const progress = Math.min(
      100,
      Math.floor((job.currentStepCount / job.totalSteps) * 100)
    );

    if (progress > job.lastProgress) {
      setProgress(progress);
      job.lastProgress = progress;
    }

    if (job.currentPos > job.endPos) {
      // console.log(`Generation Complete. Steps: ${job.currentStepCount}`);
      setGeneratedData(job.data);
      setGenerating(false);
      setProgress(100);
    }
  });

  return null;
};
export default EphController;
