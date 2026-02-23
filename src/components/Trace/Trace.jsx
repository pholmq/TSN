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
  const pointsArrRef = useRef([]);

  useEffect(() => {
    plotPosRef.current = traceStartPos;
    pointsArrRef.current = [];
  }, [traceStartPos]);

  useFrameInterval(() => {
    if (!trace) return;

    if (plotPosRef.current < posRef.current - traceLength * traceStep) {
      plotPosRef.current = posRef.current - traceLength * traceStep;
      pointsArrRef.current = [];
    }

    if (plotPosRef.current > posRef.current + traceLength * traceStep) {
      plotPosRef.current = posRef.current + traceLength * traceStep;
      pointsArrRef.current = [];
      setTraceStart(posRef.current);
    }

    // TIME-SLICING: Limit calculations to prevent frame drops
    // 50 is a safe baseline. Increase if it grows too slowly, decrease if it still stutters.
    const MAX_STEPS_PER_FRAME = 50;
    let stepsThisFrame = 0;

    // Rewinding backwards
    while (
      plotPosRef.current > posRef.current &&
      stepsThisFrame < MAX_STEPS_PER_FRAME
    ) {
      plotPosRef.current -= traceStep;
      if (pointsArrRef.current.length >= 3) {
        pointsArrRef.current.length -= 3;
      }
      stepsThisFrame++;
    }

    // Tracing forwards (The heavy calculation)
    while (
      plotPosRef.current < posRef.current - traceStep &&
      stepsThisFrame < MAX_STEPS_PER_FRAME
    ) {
      plotPosRef.current += traceStep;

      // This is the expensive call being throttled
      movePlotModel(plotObjects, plotPosRef.current);

      const tracedObj = plotObjects.find((p) => p.name === name);
      if (tracedObj && tracedObj.pivotRef.current) {
        tracedObj.pivotRef.current.getWorldPosition(objectPos);
        pointsArrRef.current.push(objectPos.x, objectPos.y, objectPos.z);
      }

      if (pointsArrRef.current.length > traceLength * 3) {
        pointsArrRef.current.splice(0, 3);
      }

      stepsThisFrame++;
    }
  }, interval);

  return (
    <TraceLine
      pointsArrRef={pointsArrRef}
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
