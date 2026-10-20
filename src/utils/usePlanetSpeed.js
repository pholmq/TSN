import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";
import { unitsToKm } from "./celestial-functions";
import { createPhysicalPositionReader } from "./physicalPosition";

const SECONDS_IN_YEAR = 365.25 * 86400;

export default function usePlanetSpeedV2(name, s, orbitRadius, scene) {
  const posRef = useStore((state) => state.posRef);
  const showSpeeds = useStore((state) => state.showSpeeds);

  const targetRef = useRef(null);
  const readPhysicalPositionRef = useRef(null);

  const prevPos = useRef(null);
  const prevWorldPos = useRef(new THREE.Vector3());
  const currentWorldPos = useRef(new THREE.Vector3());

  const totalDistKm = useRef(0);
  const totalTimeSec = useRef(0);
  const frameCount = useRef(0);

  useEffect(() => {
    if (!scene) return;

    const target = scene.getObjectByName(name);

    if (!target) {
      console.warn("usePlanetSpeed: object not found:", name);
      return;
    }

    targetRef.current = target;
    // Cache a reader that returns physical coordinates even when the Moon's
    // visible orbit is enlarged for display.
    readPhysicalPositionRef.current = createPhysicalPositionReader(name, scene);
    if (!readPhysicalPositionRef.current) {
      console.warn("usePlanetSpeed: unable to read physical position:", name);
      return;
    }

    // 🔥 PERFORMANCE: Initialize the speeds object and calculate the static orbital speed ONCE
    let initialOrbitalSpeed = 0;
    if (s.speed && s.orbitRadius) {
      const distancePerYearKm = unitsToKm(Math.abs(s.speed) * s.orbitRadius);
      initialOrbitalSpeed = distancePerYearKm / SECONDS_IN_YEAR;
    }

    target.userData.speeds = {
      orbital: initialOrbitalSpeed,
      absolute: 0,
      avgAbsolute: 0,
    };

    // reset state when target changes
    prevPos.current = null;
    totalDistKm.current = 0;
    totalTimeSec.current = 0;
    frameCount.current = 0;
  }, [scene, name, s.speed, s.orbitRadius]); // Added s parameters to dependencies

  useFrame(() => {
    if (
      !showSpeeds ||
      !targetRef.current ||
      !readPhysicalPositionRef.current ||
      posRef.current == null
    )
      return;

    const target = targetRef.current;
    const readPhysicalPosition = readPhysicalPositionRef.current;
    const currentPosTime = posRef.current;

    // --- initialization ---
    if (prevPos.current === null) {
      readPhysicalPosition(prevWorldPos.current);
      prevPos.current = currentPosTime;
      return;
    }

    const deltaYears = currentPosTime - prevPos.current;
    const isStableFrame =
      Math.abs(deltaYears) > 0.000001 && Math.abs(deltaYears) < 0.1;

    if (isStableFrame) {
      readPhysicalPosition(currentWorldPos.current);

      if (prevWorldPos.current.lengthSq() > 0) {
        frameCount.current += 1;

        if (frameCount.current > 5) {
          const distanceUnits = currentWorldPos.current.distanceTo(
            prevWorldPos.current
          );

          const distanceKm = unitsToKm(distanceUnits);
          const deltaSeconds = Math.abs(deltaYears) * SECONDS_IN_YEAR;

          if (deltaSeconds > 0) {
            const speed = distanceKm / deltaSeconds;

            target.userData.speeds.absolute = speed;

            totalDistKm.current += distanceKm;
            totalTimeSec.current += deltaSeconds;

            target.userData.speeds.avgAbsolute =
              totalTimeSec.current > 0
                ? totalDistKm.current / totalTimeSec.current
                : 0;
          }
        }
      }

      prevWorldPos.current.copy(currentWorldPos.current);
      prevPos.current = currentPosTime;
    } else if (Math.abs(deltaYears) >= 0.1) {
      readPhysicalPosition(prevWorldPos.current);
      prevPos.current = currentPosTime;

      totalDistKm.current = 0;
      totalTimeSec.current = 0;
      frameCount.current = 0;
    }
  });
}
