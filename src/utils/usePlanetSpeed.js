import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { unitsToKm } from "./celestial-functions";

const SECONDS_IN_YEAR = 365.25 * 86400; // 31,557,600 seconds

export default function usePlanetSpeed(name, s, orbitRadius, scene) {
  const posRef = useStore((state) => state.posRef);
  const showSpeeds = useStore((state) => state.showSpeeds);

  const targetRef = useRef(null);
  const prevPos = useRef(0);
  const prevWorldPos = useRef(new THREE.Vector3());
  const currentWorldPos = useRef(new THREE.Vector3());

  // Back to true physical accumulators
  const totalDistKm = useRef(0);
  const totalTimeSec = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    if (scene) {
      targetRef.current = scene.getObjectByName(name);
    }
  }, [scene, name]);

  useFrame(() => {
    if (!showSpeeds || !targetRef.current || !posRef.current) return;

    const target = targetRef.current;
    const currentPosTime = posRef.current;
    const deltaYears = currentPosTime - prevPos.current;

    if (!target.userData.speeds) {
      target.userData.speeds = { orbital: 0, absolute: 0, avgAbsolute: 0 };
    }

    if (s.speed && orbitRadius) {
      const distancePerYearKm = unitsToKm(Math.abs(s.speed) * orbitRadius);
      target.userData.speeds.orbital = distancePerYearKm / SECONDS_IN_YEAR;
    }

    // GATE 1: Filter out micro-stutters and timeline scrubs.
    // Adjust the 0.1 upper limit depending on your app's max simulation speed.
    const isStableFrame =
      Math.abs(deltaYears) > 0.000001 && Math.abs(deltaYears) < 0.1;

    if (isStableFrame) {
      target.getWorldPosition(currentWorldPos.current);

      if (prevPos.current !== 0 && prevWorldPos.current.lengthSq() > 0) {
        frameCount.current += 1;

        // GATE 2: Ignore the first 5 frames while the scene initializes
        if (frameCount.current > 5) {
          const distanceMovedUnits = currentWorldPos.current.distanceTo(
            prevWorldPos.current
          );
          const distanceMovedKm = unitsToKm(distanceMovedUnits);
          const deltaSeconds = Math.abs(deltaYears) * SECONDS_IN_YEAR;

          const currentAbsoluteSpeed = distanceMovedKm / deltaSeconds;
          target.userData.speeds.absolute = currentAbsoluteSpeed;

          // Mathematically accurate time-weighted average
          totalDistKm.current += distanceMovedKm;
          totalTimeSec.current += deltaSeconds;

          target.userData.speeds.avgAbsolute =
            totalDistKm.current / totalTimeSec.current;
        }
      }

      // Update refs for the next frame
      prevWorldPos.current.copy(currentWorldPos.current);
      prevPos.current = currentPosTime;
    } else if (Math.abs(deltaYears) >= 0.1) {
      // CRITICAL: If the user scrubs the timeline (massive deltaYears),
      // we DO NOT add the jump to our totals, but we MUST silently update
      // the positions so the next frame has a clean baseline to measure from.
      target.getWorldPosition(prevWorldPos.current);
      prevPos.current = currentPosTime;
    }
  });
}
