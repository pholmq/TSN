import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { unitsToKm } from "./celestial-functions";

// posRef.current operates in Julian Years.
const SECONDS_IN_YEAR = 365.25 * 86400; // 31,557,600 seconds

export default function usePlanetSpeed(name, s, orbitRadius, scene) {
  const posRef = useStore((state) => state.posRef);

  const prevPos = useRef(0);
  const prevWorldPos = useRef(new THREE.Vector3());
  const currentWorldPos = useRef(new THREE.Vector3());

  // Accumulators for the cumulative moving average
  const totalDistKm = useRef(0);
  const totalTimeSec = useRef(0);

  useFrame(() => {
    const target = scene.getObjectByName(name);
    if (!target || !posRef.current) return;

    const currentPosTime = posRef.current;
    const deltaYears = currentPosTime - prevPos.current;

    if (!target.userData.speeds) {
      target.userData.speeds = { orbital: 0, absolute: 0, avgAbsolute: 0 };
    }

    // 1. Orbital Speed (km/s)
    if (s.speed && orbitRadius) {
      const distancePerYearKm = unitsToKm(Math.abs(s.speed) * orbitRadius);
      target.userData.speeds.orbital = distancePerYearKm / SECONDS_IN_YEAR;
    }

    // 2. Absolute & Average Absolute Speed (km/s)
    if (Math.abs(deltaYears) > 0) {
      target.getWorldPosition(currentWorldPos.current);

      if (prevPos.current !== 0 && prevWorldPos.current.lengthSq() > 0) {
        const distanceMovedUnits = currentWorldPos.current.distanceTo(
          prevWorldPos.current
        );
        const distanceMovedKm = unitsToKm(distanceMovedUnits);

        const deltaSeconds = Math.abs(deltaYears) * SECONDS_IN_YEAR;

        // Instantaneous Absolute Speed
        target.userData.speeds.absolute = distanceMovedKm / deltaSeconds;

        // Cumulative Average Absolute Speed
        totalDistKm.current += distanceMovedKm;
        totalTimeSec.current += deltaSeconds;
        target.userData.speeds.avgAbsolute =
          totalDistKm.current / totalTimeSec.current;
      }

      prevWorldPos.current.copy(currentWorldPos.current);
      prevPos.current = currentPosTime;
    }
  });
}
