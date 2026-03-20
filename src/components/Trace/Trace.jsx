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

  const maxFloats = traceLength * 3;
  const pointsArrRef = useRef(new Float32Array(maxFloats));
  const pointCountRef = useRef(0);

  useEffect(() => {
    plotPosRef.current = traceStartPos;
    pointCountRef.current = 0;
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

    // We only allow this function to run for 50 milliseconds per frame.
    const startTime = performance.now();
    const TIME_BUDGET_MS = 50;

    // Rewinding backwards (Extremely fast, usually negligible)
    while (
      plotPosRef.current > posRef.current &&
      performance.now() - startTime < TIME_BUDGET_MS
    ) {
      plotPosRef.current -= traceStep;
      if (pointCountRef.current > 0) pointCountRef.current--;
    }

    // Tracing forwards (The heavy calculation)
    while (
      plotPosRef.current < posRef.current - traceStep &&
      performance.now() - startTime < TIME_BUDGET_MS
    ) {
      plotPosRef.current += traceStep;

      // Moving the shadow solar system
      movePlotModel(plotObjects, plotPosRef.current);

      const tracedObj = plotObjects.find((p) => p.name === name);
      if (tracedObj && tracedObj.pivotRef.current) {
        // Force the shadow object to calculate its global matrix based on the new simulated time
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
