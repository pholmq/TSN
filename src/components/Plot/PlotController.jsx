import { useEffect, useState, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { usePlotStore } from "../../store"; // The main store for plot objects
import { usePlotterStore } from "./plotStore"; // The local store for this feature
import { posToDate, dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";
import PlotVisuals from "./PlotVisuals";

const PlotController = () => {
  // Use 'scene' if we need to access world manually, but plotObjects have refs
  const plotObjects = usePlotObjectsStore((s) => s.plotObjects);

  const {
    trigger,
    params,
    resetTrigger,
    setGeneratedData,
    setGenerationError,
    setIsGenerating,
    generatedData,
    showResult,
  } = usePlotStore();

  const [generating, setGenerating] = useState(false);

  const jobRef = useRef({
    currentPos: 0,
    endPos: 0,
    increment: 0,
    checkedPlanets: [],
    data: {},
    totalSteps: 0,
  });

  // 1. Initialize Job
  useEffect(() => {
    if (trigger && params) {
      setIsGenerating(true);

      const startPos = dateTimeToPos(params.startDate, "00:00:00");
      const endPos = dateTimeToPos(params.endDate, "00:00:00");
      const increment = params.stepSize * params.stepFactor;

      const calculatedSteps = Math.floor((endPos - startPos) / increment) + 1;
      const totalOperations = calculatedSteps * params.checkedPlanets.length;

      // Safety Limit
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
        endPos: endPos,
        increment: increment,
        checkedPlanets: params.checkedPlanets,
        data: initialData,
        totalSteps: calculatedSteps,
      };

      setGenerating(true);
      resetTrigger();
    }
  }, [trigger, params, resetTrigger, setGenerationError, setIsGenerating]);

  // 2. Process Job
  useFrame(() => {
    if (!generating) return;

    const job = jobRef.current;
    const BATCH_SIZE = 100; // Higher batch size for simple position gathering
    let batchCount = 0;

    while (job.currentPos <= job.endPos && batchCount < BATCH_SIZE) {
      // Move the invisible calculation model
      movePlotModel(plotObjects, job.currentPos);

      // Collect positions
      job.checkedPlanets.forEach((name) => {
        let targetName = name;
        if (name === "Moon") {
          const hasActualMoon = plotObjects.some(
            (p) => p.name === "Actual Moon"
          );
          if (hasActualMoon) targetName = "Actual Moon";
        }

        const targetObj = plotObjects.find((p) => p.name === targetName);

        if (targetObj && targetObj.pivotRef && targetObj.pivotRef.current) {
          const vec = new Vector3();
          targetObj.pivotRef.current.getWorldPosition(vec);
          // Store simple xyz object or array to save memory/complexity
          job.data[name].push(vec.toArray());
        }
      });

      job.currentPos += job.increment;
      batchCount++;
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
