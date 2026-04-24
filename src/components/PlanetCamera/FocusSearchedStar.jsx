// src/components/PlanetCamera/FocusSearchedStar.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import TWEEN from "@tweenjs/tween.js";

export default function FocusSearchedStar() {
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarHR = useStore((s) => s.setSelectedStarHR);
  const planetCamera = useStore((s) => s.planetCamera);

  // --- Interceptor State ---
  const searchTarget = useStore((s) => s.searchTarget);
  const searchUpdate = useStore((s) => s.searchUpdate);
  const searchStars = useStore((s) => s.searchStars);
  const prevSearchUpdate = useRef(searchUpdate);

  const tweenRef = useRef(null);
  const { scene } = useThree();

  // ==========================================
  // 1. THE FALLBACK INTERCEPTOR
  // ==========================================
  useEffect(() => {
    if (searchUpdate > prevSearchUpdate.current) {
      prevSearchUpdate.current = searchUpdate;
      if (!searchStars && searchTarget && planetCamera) {
        const cleanTarget = String(searchTarget).replace("BSCStarTarget_", "");
        if (scene.getObjectByName(cleanTarget)) {
          setSelectedStarHR(`Planet:${cleanTarget}`);
        } else {
          setSelectedStarHR(cleanTarget);
        }
        useStore.getState().setCameraTarget(searchTarget);
      }
    }
  }, [
    searchUpdate,
    searchTarget,
    searchStars,
    planetCamera,
    scene,
    setSelectedStarHR,
  ]);

  // ==========================================
  // 2. THE LOCAL PROJECTION ENGINE (Flawless Math)
  // ==========================================
  useEffect(() => {
    if (!selectedStarHR || !planetCamera) return;

    const planetCameraTarget =
      usePlanetCameraStore.getState().planetCameraTarget;
    if (planetCameraTarget !== "Earth") return;

    const timeoutId = setTimeout(() => {
      let targetWorldPos = null;

      // 1. Identify Target
      let targetObjectName = null;
      if (selectedStarHR.startsWith("Planet:")) {
        targetObjectName = selectedStarHR.replace("Planet:", "");
      } else if (selectedStarHR.startsWith("Special:")) {
        targetObjectName = selectedStarHR.replace("Special:", "");
      } else {
        const obj = scene.getObjectByName(selectedStarHR);
        if (obj) targetObjectName = selectedStarHR;
      }

      if (targetObjectName) {
        const targetObj = scene.getObjectByName(targetObjectName);
        if (targetObj) {
          targetWorldPos = new THREE.Vector3();
          targetObj.getWorldPosition(targetWorldPos);
        }
      }

      // 2. Fallback for background stars
      if (!targetWorldPos) {
        const starPos = useStore.getState().selectedStarPosition;
        if (starPos && starPos instanceof THREE.Vector3) {
          targetWorldPos = starPos.clone();
        }
      }

      if (!targetWorldPos) return;

      // 3. Get the camera's local mount space
      const planetCam = scene.getObjectByName("PlanetCamera");
      if (!planetCam || !planetCam.parent) return;
      const camMount = planetCam.parent;

      // Force scene to update all world matrices so math is strictly accurate
      scene.updateMatrixWorld(true);

      // 4. Convert global position into the camera mount's local coordinate system
      const targetLocalPos = camMount.worldToLocal(targetWorldPos.clone());
      targetLocalPos.normalize();

      // 5. Mathematically derive Altitude and Azimuth from local coordinates
      // PlanetCamera sets: rotation.x = altToRad(Angle), rotation.y = dirToRad(Direction)
      const RAD2DEG = 180 / Math.PI;

      // Altitude (Pitch) corresponds to the Y height in local space
      const altitude = Math.asin(targetLocalPos.y) * RAD2DEG;

      // Azimuth (Yaw) corresponds to angle in the XZ plane.
      // In PlanetCamera's local space: North is +Z. East is -X.
      let azimuth = Math.atan2(-targetLocalPos.x, targetLocalPos.z) * RAD2DEG;

      // Normalize Azimuth to 0-360 degrees
      azimuth = ((azimuth % 360) + 360) % 360;

      if (isNaN(altitude) || isNaN(azimuth)) return;

      // 6. Execute Tween
      const currentAngle = usePlanetCameraStore.getState().planCamAngle;
      const currentDirection = usePlanetCameraStore.getState().planCamDirection;

      // Find shortest rotation path to prevent rapid spinning
      let diffAz = (azimuth - currentDirection) % 360;
      if (diffAz < -180) diffAz += 360;
      if (diffAz > 180) diffAz -= 360;
      const targetAzimuth = currentDirection + diffAz;

      const coords = { angle: currentAngle, direction: currentDirection };
      const setPlanCamAngle = usePlanetCameraStore.getState().setPlanCamAngle;
      const setPlanCamDirection =
        usePlanetCameraStore.getState().setPlanCamDirection;
      const setIsCameraAnimating =
        usePlanetCameraStore.getState().setIsCameraAnimating;

      if (tweenRef.current) tweenRef.current.stop();

      tweenRef.current = new TWEEN.Tween(coords)
        .to({ angle: altitude, direction: targetAzimuth }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => setIsCameraAnimating && setIsCameraAnimating(true))
        .onUpdate(() => {
          if (!isNaN(coords.angle)) setPlanCamAngle(coords.angle);
          if (!isNaN(coords.direction)) setPlanCamDirection(coords.direction);
        })
        .onComplete(() => setIsCameraAnimating && setIsCameraAnimating(false))
        .onStop(() => setIsCameraAnimating && setIsCameraAnimating(false))
        .start();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [selectedStarHR, planetCamera, scene]);

  useFrame(() => {
    if (tweenRef.current) TWEEN.update();
  });

  if (!planetCamera) return null;
  return null;
}
