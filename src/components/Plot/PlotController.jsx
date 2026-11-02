import { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { usePlotStore } from "../../store";
import { usePlotterStore } from "./plotStore";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";
import PlotVisuals from "./PlotVisuals";

const PlotController = () => {
  const plotObjects = usePlotStore((state) => state.plotObjects);

  const {
    trigger,
    params,
    resetTrigger,
    setGeneratedData,
    setGenerationError,
    setIsGenerating,
    generatedData,
    showResult,
  } = usePlotterStore();

  const [generating, setGenerating] = useState(false);

  const jobRef = useRef({
    currentPos: 0,
    endPos: 0,
    increment: 0,
    checkedPlanets: [],
    data: {},
    totalSteps: 0,
  });

  // Initialize the requested date range and output arrays.
  useEffect(() => {
    if (!trigger || !params) return;

    setIsGenerating(true);

    const startPos = dateTimeToPos(params.startDate, "00:00:00");
    const endPos = dateTimeToPos(params.endDate, "00:00:00");
    const increment = params.stepSize * params.stepFactor;
    const calculatedSteps = Math.floor((endPos - startPos) / increment) + 1;
    const totalOperations = calculatedSteps * params.checkedPlanets.length;

    if (totalOperations > 200000) {
      const errorMsg = `Too many points to plot (${totalOperations}). Please reduce range or increase step size.`;
      setGenerationError(errorMsg);
      setIsGenerating(false);
      resetTrigger();
      return;
    }

    const initialData = {};
    params.checkedPlanets.forEach((planet) => {
      initialData[planet] = [];
    });

    jobRef.current = {
      currentPos: startPos,
      endPos,
      increment,
      checkedPlanets: params.checkedPlanets,
      data: initialData,
      totalSteps: calculatedSteps,
    };

    setGenerating(true);
    resetTrigger();
  }, [trigger, params, resetTrigger, setGenerationError, setIsGenerating]);

  // Batch generation to avoid blocking the renderer for the whole date range.
  // These are visual plot positions: preserve the Moon's display scale so its
  // generated trace aligns with the exaggerated Moon shown in the live scene.
  useFrame(() => {
    if (!generating) return;

    const job = jobRef.current;
    const BATCH_SIZE = 100;
    let batchCount = 0;

    while (job.currentPos <= job.endPos && batchCount < BATCH_SIZE) {
      movePlotModel(plotObjects, job.currentPos);

      job.checkedPlanets.forEach((name) => {
        const targetObj = plotObjects.find((item) => item.name === name);
        if (targetObj?.pivotRef?.current) {
          const vec = new Vector3();
          targetObj.pivotRef.current.getWorldPosition(vec);
          job.data[name].push(vec.toArray());
        }
      });

      job.currentPos += job.increment;
      batchCount += 1;
    }

    if (job.currentPos > job.endPos) {
      setGeneratedData(job.data);
      setGenerating(false);
    }
  });

  return (
    <>{showResult && generatedData && <PlotVisuals data={generatedData} />}</>
  );
};

export default PlotController;
