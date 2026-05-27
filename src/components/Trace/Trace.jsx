import { useRef, useEffect } from "react";
import { Vector3 } from "three";
import useFrameInterval from "../../utils/useFrameInterval";
import { useStore, usePlotStore, useSettingsStore } from "../../store";
import { useTraceStore } from "./traceStore";
import { getSpeedFact } from "../../utils/time-date-functions.js";
import { movePlotModel } from "../../utils/plotModelFunctions";
import TraceLine from "./TraceLine";

const objectPos = new Vector3();

const Trace = ({ name }) => {
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const posRef = useStore((s) => s.posRef);
  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes); // Grab state to trigger redraws

  const {
    trace,
    interval,
    lineWidth,
    lengthMultiplier,
    stepMultiplier,
    dotted,
    traceStartPos,
    setTraceStart,
    customTrace,
    customLength,
    customStep,
    customStepFact,
  } = useTraceStore();

  const getSetting = useSettingsStore((s) => s.getSetting);
  const s = getSetting(name);

  // Apply custom variables if toggle is active
  const activeLength = customTrace ? customLength : s.traceSettings.length;
  const activeStep = customTrace ? customStep : s.traceSettings.step;
  const activeStepFact = customTrace
    ? customStepFact
    : s.traceSettings.stepFact;

  const traceLength = Math.round((activeLength * lengthMultiplier) / 3) * 3;
  const traceStep = activeStep * getSpeedFact(activeStepFact) * stepMultiplier;

  const plotPosRef = useRef(traceStartPos);

  const maxFloats = traceLength * 3;
  const pointsArrRef = useRef(new Float32Array(maxFloats));
  const pointCountRef = useRef(0);

  // Handle initialization and restarts
  useEffect(() => {
    plotPosRef.current = traceStartPos;
    pointCountRef.current = 0;
  }, [traceStartPos, trace, traceStep]);

  // Handle trace buffer sizing to prevent memory leaks or out of bounds when traceLength updates
  useEffect(() => {
    if (pointsArrRef.current.length !== maxFloats) {
      pointsArrRef.current = new Float32Array(maxFloats);
      pointCountRef.current = 0;
      plotPosRef.current = traceStartPos;
    }
  }, [maxFloats, traceStartPos]);

  // FIX: Clear and restart the trace line whenever actualPlanetSizes is toggled
  useEffect(() => {
    setTraceStart(posRef.current);
    pointCountRef.current = 0;
    plotPosRef.current = posRef.current;
  }, [actualPlanetSizes, setTraceStart]);

  useFrameInterval(() => {
    if (!trace) return;

    if (plotPosRef.current < posRef.current - traceLength * traceStep) {
      plotPosRef.current = posRef.current - traceLength * traceStep;
      pointCountRef.current = 0;
    }

    if (plotPosRef.current > posRef.current + traceLength * traceStep) {
      plotPosRef.current = posRef.current + traceLength * traceStep;
      pointCountRef.current = 0;
      setTraceStart(posRef.current);
    }

    const startTime = performance.now();
    const TIME_BUDGET_MS = 50;

    while (
      plotPosRef.current > posRef.current &&
      performance.now() - startTime < TIME_BUDGET_MS
    ) {
      plotPosRef.current -= traceStep;
      if (pointCountRef.current > 0) pointCountRef.current--;
    }

    while (
      plotPosRef.current < posRef.current - traceStep &&
      performance.now() - startTime < TIME_BUDGET_MS
    ) {
      plotPosRef.current += traceStep;

      movePlotModel(plotObjects, plotPosRef.current);

      const tracedObj = plotObjects.find((p) => p.name === name);
      if (tracedObj && tracedObj.pivotRef.current) {
        tracedObj.pivotRef.current.updateMatrixWorld(true);
        tracedObj.pivotRef.current.getWorldPosition(objectPos);

        if (pointCountRef.current * 3 >= maxFloats) {
          pointsArrRef.current.copyWithin(0, 3);
          const lastIdx = maxFloats - 3;
          pointsArrRef.current[lastIdx] = objectPos.x;
          pointsArrRef.current[lastIdx + 1] = objectPos.y;
          pointsArrRef.current[lastIdx + 2] = objectPos.z;
        } else {
          const idx = pointCountRef.current * 3;
          pointsArrRef.current[idx] = objectPos.x;
          pointsArrRef.current[idx + 1] = objectPos.y;
          pointsArrRef.current[idx + 2] = objectPos.z;
          pointCountRef.current++;
        }
      }
    }
  }, interval);

  return (
    <TraceLine
      pointsArrRef={pointsArrRef}
      pointCountRef={pointCountRef}
      traceLength={traceLength}
      color={s.color}
      dots={dotted}
      lineWidth={lineWidth}
      interval={interval}
      raycast={() => null}
    />
  );
};

export default Trace;
