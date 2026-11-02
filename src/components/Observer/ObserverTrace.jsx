import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { useStore, usePlotStore, useSettingsStore } from "../../store";
import { useObserverStore } from "./observerStore";
import { useTraceStore } from "../Trace/traceStore";
import TraceLine from "../Trace/TraceLine";
import useFrameInterval from "../../utils/useFrameInterval";
import { movePlotModel } from "../../utils/plotModelFunctions";
import { getObserverLocalPosition } from "./observerPosition";
import {
  addMonths,
  addYears,
  dateToDays,
  posToDate,
  posToTime,
  sDay,
  sMonth,
  sYear,
  timeToPos,
} from "../../utils/time-date-functions";

const BASE_MAX_POINTS = 5000;
const observerPosition = new Vector3();

function advanceOneSelectedStep(time, speedFact, speedMultiplier) {
  if (speedFact === sYear || speedFact === sMonth) {
    const date = posToDate(time);
    const nextDate =
      speedFact === sYear
        ? addYears(date, speedMultiplier)
        : addMonths(date, speedMultiplier);
    return dateToDays(nextDate) * sDay + timeToPos(posToTime(time));
  }

  return time + speedFact * speedMultiplier;
}

export default function ObserverTrace() {
  const posRef = useStore((s) => s.posRef);
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const earthSettings = useSettingsStore((s) =>
    s.settings.find((setting) => setting.name === "Earth")
  );
  const latitude = useObserverStore((s) => s.latitude);
  const longitude = useObserverStore((s) => s.longitude);
  const traceObserver = useObserverStore((s) => s.traceObserver);
  const traceColor = useObserverStore((s) => s.traceColor);
  const { lineWidth, dotted, interval, lengthMultiplier } = useTraceStore();

  const traceLength = Math.max(
    2,
    Math.round(BASE_MAX_POINTS * lengthMultiplier)
  );
  const pointsArrRef = useRef(new Float32Array(traceLength * 3));
  const pointCountRef = useRef(0);
  const lastRecordedTimeRef = useRef(null);

  const appendPoint = (time) => {
    const earth = plotObjects.find((object) => object.name === "Earth");
    const earthFrame = earth?.cSphereRef?.current;
    if (!earthFrame || !earthSettings) return false;

    movePlotModel(plotObjects, time);
    earthFrame.updateWorldMatrix(true, false);
    getObserverLocalPosition({
      latitude,
      longitude,
      radius: Number(earthSettings.actualSize || 0.00426),
      time,
      rotationStart: earthSettings.rotationStart,
      rotationSpeed: earthSettings.rotationSpeed,
      target: observerPosition,
    }).applyMatrix4(earthFrame.matrixWorld);

    if (pointCountRef.current >= traceLength) {
      pointsArrRef.current.copyWithin(0, 3);
      pointCountRef.current = traceLength - 1;
    }

    const offset = pointCountRef.current * 3;
    pointsArrRef.current[offset] = observerPosition.x;
    pointsArrRef.current[offset + 1] = observerPosition.y;
    pointsArrRef.current[offset + 2] = observerPosition.z;
    pointCountRef.current++;
    lastRecordedTimeRef.current = time;
    return true;
  };

  useEffect(() => {
    pointsArrRef.current = new Float32Array(traceLength * 3);
    pointCountRef.current = 0;
    lastRecordedTimeRef.current = null;
  }, [traceObserver, traceLength, latitude, longitude]);

  useFrameInterval(() => {
    if (!traceObserver) return;

    const positionTime = posRef.current;
    if (positionTime === null || positionTime === undefined) return;

    const previousTime = lastRecordedTimeRef.current;
    if (previousTime === null) {
      appendPoint(positionTime);
      return;
    }

    const { run, speedFact, speedMultiplier } = useStore.getState();
    if (!run) {
      if (positionTime !== previousTime) appendPoint(positionTime);
      return;
    }

    // Playback itself is continuous, but the observer trace advances only at
    // the exact dates produced by the UI's step buttons. Month and year steps
    // are calendar-aware rather than average numeric durations.
    const startTime = performance.now();
    const timeBudgetMs = 50;
    let nextTime = advanceOneSelectedStep(
      previousTime,
      Number(speedFact),
      Number(speedMultiplier)
    );
    let direction = Math.sign(nextTime - previousTime);

    while (
      direction !== 0 &&
      direction * (positionTime - nextTime) >= -Number.EPSILON &&
      performance.now() - startTime < timeBudgetMs
    ) {
      if (!appendPoint(nextTime)) return;
      const followingTime = advanceOneSelectedStep(
        nextTime,
        Number(speedFact),
        Number(speedMultiplier)
      );
      direction = Math.sign(followingTime - nextTime);
      nextTime = followingTime;
      if (!Number.isFinite(nextTime)) return;
    }
  }, interval);

  if (!traceObserver) return null;

  return (
    <TraceLine
      pointsArrRef={pointsArrRef}
      pointCountRef={pointCountRef}
      traceLength={traceLength}
      color={traceColor}
      dots={dotted}
      lineWidth={lineWidth}
      interval={interval}
    />
  );
}
