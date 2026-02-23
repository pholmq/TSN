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

// 1. Hoist Vector3 outside to eliminate GC pressure on every frame/render
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

  // Length should be a multiple of three
  const traceLength =
    Math.round((s.traceSettings.length * lengthMultiplier) / 3) * 3;
  const traceStep =
    s.traceSettings.step *
    getSpeedFact(s.traceSettings.stepFact) *
    stepMultiplier;

  const plotPosRef = useRef(traceStartPos);
  const pointsArrRef = useRef([]);

  // 2. Prevent trace wiping: Only initialize/reset when traceStartPos actually changes
  useEffect(() => {
    plotPosRef.current = traceStartPos;
    pointsArrRef.current = [];
  }, [traceStartPos]);

  useFrameInterval(() => {
    if (!trace) return;

    // Check and adjust plotPos if the pos is out of bounds
    if (plotPosRef.current < posRef.current - traceLength * traceStep) {
      plotPosRef.current = posRef.current - traceLength * traceStep;
      pointsArrRef.current = [];
    }

    if (plotPosRef.current > posRef.current + traceLength * traceStep) {
      plotPosRef.current = posRef.current + traceLength * traceStep;
      pointsArrRef.current = [];
      // If we move backwards out of bounds we need to update trace start!
      setTraceStart(posRef.current);
    }

    // Rewinding backwards
    while (plotPosRef.current > posRef.current) {
      plotPosRef.current -= traceStep;
      // 3. Optimization: Modifying length directly is much faster than splicing from the end
      if (pointsArrRef.current.length >= 3) {
        pointsArrRef.current.length -= 3;
      }
    }

    // Tracing forwards
    while (plotPosRef.current < posRef.current - traceStep) {
      plotPosRef.current += traceStep;
      movePlotModel(plotObjects, plotPosRef.current);

      const tracedObj = plotObjects.find((p) => p.name === name);
      if (tracedObj && tracedObj.pivotRef.current) {
        tracedObj.pivotRef.current.getWorldPosition(objectPos);
        pointsArrRef.current.push(objectPos.x, objectPos.y, objectPos.z);
      }

      if (pointsArrRef.current.length > traceLength * 3) {
        // Splice from the front (Note: if this still bottlenecks, we will need to refactor
        // TraceLine.jsx to accept a Float32Array circular buffer instead of a standard Array)
        pointsArrRef.current.splice(0, 3);
      }
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
