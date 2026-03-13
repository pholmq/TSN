import { useRef, useEffect } from "react";
import { Vector3 } from "three";
import useFrameInterval from "../../utils/useFrameInterval";
import {
  useStore,
  usePlotStore,
  useTraceStore,
  useSettingsStore,
} from "../../store";
import { getSpeedFact } from "../../utils/time-date-functions.js";
import { movePlotModel } from "../../utils/plotModelFunctions";
import TraceLine from "./TraceLine";

const objectPos = new Vector3();

const Trace = ({ name }) => {
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const posRef = useStore((s) => s.posRef);
  const {
    trace,
    interval,
    lineWidth,
    lengthMultiplier,
    stepMultiplier,
    dotted,
    traceStartPos,
    setTraceStart,
  } = useTraceStore();

  const getSetting = useSettingsStore((s) => s.getSetting);
  const s = getSetting(name);

  const traceLength =
    Math.round((s.traceSettings.length * lengthMultiplier) / 3) * 3;
  const traceStep =
    s.traceSettings.step *
    getSpeedFact(s.traceSettings.stepFact) *
    stepMultiplier;

  const plotPosRef = useRef(traceStartPos);

  // PERFORMANCE FIX: Pre-allocate a fixed-size Float32Array to completely stop Garbage Collection pauses
  const maxFloats = traceLength * 3;
  const pointsArrRef = useRef(new Float32Array(maxFloats));
  const pointCountRef = useRef(0); // Tracks how many points are currently active

  useEffect(() => {
    plotPosRef.current = traceStartPos;
    pointCountRef.current = 0; // Reset
  }, [traceStartPos, trace, traceStep]);

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

    // Lowered slightly to prevent main-thread locking from heavy movePlotModel math
    const MAX_STEPS_PER_FRAME = 20;
    let stepsThisFrame = 0;

    // Rewinding backwards
    while (
      plotPosRef.current > posRef.current &&
      stepsThisFrame < MAX_STEPS_PER_FRAME
    ) {
      plotPosRef.current -= traceStep;
      if (pointCountRef.current > 0) {
        // Just move the pointer back, zero GC allocations!
        pointCountRef.current--;
      }
      stepsThisFrame++;
    }

    // Tracing forwards (The heavy calculation)
    while (
      plotPosRef.current < posRef.current - traceStep &&
      stepsThisFrame < MAX_STEPS_PER_FRAME
    ) {
      plotPosRef.current += traceStep;

      movePlotModel(plotObjects, plotPosRef.current);

      const tracedObj = plotObjects.find((p) => p.name === name);
      if (tracedObj && tracedObj.pivotRef.current) {
        tracedObj.pivotRef.current.getWorldPosition(objectPos);

        if (pointCountRef.current * 3 >= maxFloats) {
          // Array is full. Use raw memory move (blazing fast) instead of array.splice()
          pointsArrRef.current.copyWithin(0, 3);
          const lastIdx = maxFloats - 3;
          pointsArrRef.current[lastIdx] = objectPos.x;
          pointsArrRef.current[lastIdx + 1] = objectPos.y;
          pointsArrRef.current[lastIdx + 2] = objectPos.z;
        } else {
          // Fill next available slot
          const idx = pointCountRef.current * 3;
          pointsArrRef.current[idx] = objectPos.x;
          pointsArrRef.current[idx + 1] = objectPos.y;
          pointsArrRef.current[idx + 2] = objectPos.z;
          pointCountRef.current++;
        }
      }
      stepsThisFrame++;
    }
  }, interval);

  return (
    <TraceLine
      pointsArrRef={pointsArrRef}
      pointCountRef={pointCountRef} // Pass the pointer down so the line knows where to stop drawing
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
