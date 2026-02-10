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
    startPos: 0,
    currentStep: 0,
    totalSteps: 0,
    increment: 0,
    checkedPlanets: [],
    data: {},
    lastProgress: 0,
  });

  // 1. Initialize Job
  useEffect(() => {
    if (trigger && params) {
      setIsGenerating(true);
      setProgress(0);

      const startPos = dateTimeToPos(params.startDate, "00:00:00");
      const endPos = dateTimeToPos(params.endDate, "00:00:00");
      let increment = params.stepSize * params.stepFactor;

      // Reverse direction if Start > End
      if (startPos > endPos) {
        increment = -increment;
      }

      // FIX 1: Calculate Total Steps using Math.round to snap 23.999 -> 24
      const totalSteps = Math.round((endPos - startPos) / increment);

      // Initialize Data Structure
      const initialData = {};
      params.checkedPlanets.forEach((planet) => {
        initialData[planet] = [];
      });

      // Setup Job
      jobRef.current = {
        startPos: startPos,
        currentStep: 0, // We use an integer counter now
        totalSteps: totalSteps,
        increment: increment,
        checkedPlanets: params.checkedPlanets,
        data: initialData,
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
      setGenerating(false);
      return;
    }

    if (!generating) return;

    invalidate();

    const job = jobRef.current;
    const BATCH_SIZE = 50;
    let batchCount = 0;

    // FIX 2: Loop based on integer 'currentStep' instead of float 'currentPos'
    while (job.currentStep <= job.totalSteps && batchCount < BATCH_SIZE) {
      // FIX 3: Calculate position freshly from start to avoid accumulation error
      // Formula: start + (stepNumber * stepSize)
      const currentPos = job.startPos + job.currentStep * job.increment;

      const currentDate = posToDate(currentPos);
      const currentTime = posToTime(currentPos);

      movePlotModel(plotObjects, currentPos);

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

      job.currentStep++;
      batchCount++;
    }

    const progress = Math.min(
      100,
      Math.floor((job.currentStep / (job.totalSteps + 1)) * 100)
    );

    if (progress > job.lastProgress) {
      setProgress(progress);
      job.lastProgress = progress;
    }

    // Completion Check (Integer based)
    if (job.currentStep > job.totalSteps) {
      setGeneratedData(job.data);
      setGenerating(false);
      setProgress(100);
    }
  });

  return null;
};
export default EphController;
