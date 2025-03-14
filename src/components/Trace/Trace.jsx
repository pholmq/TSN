import { useRef } from "react";
import useFrameInterval from "../../utils/useFrameInterval";
import {
  useStore,
  usePlotStore,
  useTraceStore,
  useSettingsStore,
} from "../../store";
import { Vector3 } from "three";
import { getSpeedFact } from "../../utils/time-date-functions.js";
import TraceLine from "./TraceLine";
function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}

const Trace = ({ name }) => {
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const plotPosRef = useRef(0);
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
  //length should be multible by three
  const traceLength =
    Math.round((s.traceSettings.length * lengthMultiplier) / 3) * 3;
  const traceStep =
    s.traceSettings.step *
    getSpeedFact(s.traceSettings.stepFact) *
    stepMultiplier;
  const pointsArrRef = useRef([]);
  const tracedObj = plotObjects.find((p) => p.name === name);
  const objectPos = new Vector3();

  plotPosRef.current = traceStartPos;
  pointsArrRef.current = [];

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
      //If we move backwards out of bounds we need to update trace start!
      setTraceStart(posRef.current);
    }

    while (plotPosRef.current > posRef.current) {
      plotPosRef.current = plotPosRef.current - traceStep;

      pointsArrRef.current.splice(pointsArrRef.current.length - 3, 3);
    }

    while (plotPosRef.current < posRef.current - traceStep) {
      plotPosRef.current = plotPosRef.current + traceStep;
      moveModel(plotObjects, plotPosRef.current);
      tracedObj.pivotRef.current.getWorldPosition(objectPos);
      if (pointsArrRef.current.length + 3 > traceLength * 3) {
        pointsArrRef.current.splice(0, 3);
      }
      pointsArrRef.current.push(objectPos.x, objectPos.y, objectPos.z);
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
    />
  );
};

export default Trace;
