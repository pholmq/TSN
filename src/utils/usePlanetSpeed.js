import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { unitsToKm } from "./celestial-functions";

const SECONDS_IN_YEAR = 365.25 * 86400; // 31,557,600 seconds

export default function usePlanetSpeed(name, s, orbitRadius, scene) {
  const posRef = useStore((state) => state.posRef);
  const showSpeeds = useStore((state) => state.showSpeeds);

  // The logical object where speeds are stored (e.g., "Moon")
  const targetRef = useRef(null);
  // The physical object used to calculate actual 3D movement (e.g., "Actual Moon")
  const physTargetRef = useRef(null);

  const prevPos = useRef(0);
  const prevWorldPos = useRef(new THREE.Vector3());
  const currentWorldPos = useRef(new THREE.Vector3());

  const totalDistKm = useRef(0);
  const totalTimeSec = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    if (scene) {
      targetRef.current = scene.getObjectByName(name);
      // Reroute the physical tracking target for the Moon
      physTargetRef.current =
        name === "Moon"
          ? scene.getObjectByName("Actual Moon")
          : targetRef.current;
    }
  }, [scene, name]);

  useFrame(() => {
    if (
      !showSpeeds ||
      !targetRef.current ||
      !physTargetRef.current ||
      !posRef.current
    )
      return;

    const target = targetRef.current;
    const physTarget = physTargetRef.current;
    const currentPosTime = posRef.current;
    const deltaYears = currentPosTime - prevPos.current;

    if (!target.userData.speeds) {
      target.userData.speeds = { orbital: 0, absolute: 0, avgAbsolute: 0 };
    }

    if (s.speed && orbitRadius) {
      const distancePerYearKm = unitsToKm(Math.abs(s.speed) * orbitRadius);
      target.userData.speeds.orbital = distancePerYearKm / SECONDS_IN_YEAR;
    }

    const isStableFrame =
      Math.abs(deltaYears) > 0.000001 && Math.abs(deltaYears) < 0.1;

    if (isStableFrame) {
      // ALWAYS measure position from the physical target
      physTarget.getWorldPosition(currentWorldPos.current);

      if (prevPos.current !== 0 && prevWorldPos.current.lengthSq() > 0) {
        frameCount.current += 1;

        if (frameCount.current > 5) {
          const distanceMovedUnits = currentWorldPos.current.distanceTo(
            prevWorldPos.current
          );
          const distanceMovedKm = unitsToKm(distanceMovedUnits);
          const deltaSeconds = Math.abs(deltaYears) * SECONDS_IN_YEAR;

          const currentAbsoluteSpeed = distanceMovedKm / deltaSeconds;

          // ALWAYS store the calculated data on the logical target
          target.userData.speeds.absolute = currentAbsoluteSpeed;

          totalDistKm.current += distanceMovedKm;
          totalTimeSec.current += deltaSeconds;

          target.userData.speeds.avgAbsolute =
            totalDistKm.current / totalTimeSec.current;
        }
      }

      prevWorldPos.current.copy(currentWorldPos.current);
      prevPos.current = currentPosTime;
    } else if (Math.abs(deltaYears) >= 0.1) {
      physTarget.getWorldPosition(prevWorldPos.current);
      prevPos.current = currentPosTime;
    }
  });
}
