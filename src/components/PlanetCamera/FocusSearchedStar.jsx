// src/components/PlanetCamera/FocusSearchedStar.jsx

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import * as THREE from "three";

export default function FocusSearchedStar() {
  const { scene } = useThree();
  const selectedStarPosition = useStore((s) => s.selectedStarPosition);
  const planetCamera = useStore((s) => s.planetCamera);
  const selectedStarHR = useStore((s) => s.selectedStarHR);

  useEffect(() => {
    if (!selectedStarPosition || !selectedStarHR) return;

    const setPlanCamAngle = usePlanetCameraStore.getState().setPlanCamAngle;
    const setPlanCamDirection =
      usePlanetCameraStore.getState().setPlanCamDirection;

    const planetCamRef = scene.getObjectByName("PlanetCamera");
    if (!planetCamRef) return;

    // Get camera world position
    const camWorldPos = new THREE.Vector3();
    planetCamRef.getWorldPosition(camWorldPos);

    // Get planet position
    let planetRef = planetCamRef;
    while (planetRef.parent && planetRef.parent.type !== "Scene") {
      planetRef = planetRef.parent;
    }
    const planetPos = new THREE.Vector3();
    planetRef.getWorldPosition(planetPos);

    // Get lat and long axis groups (level 2 and 3 from camera)
    const latAxisRef = planetCamRef.parent?.parent;
    const longAxisRef = latAxisRef?.parent;

    if (!latAxisRef || !longAxisRef) {
      console.error("Could not find lat/long axes");
      return;
    }

    // Direction to star from camera
    const toStar = selectedStarPosition.clone().sub(camWorldPos).normalize();

    // Local up (radial from planet center)
    const localUp = camWorldPos.clone().sub(planetPos).normalize();

    // Calculate altitude (angle above horizon)
    const altitudeRad = Math.asin(toStar.dot(localUp));
    const altitudeDeg = THREE.MathUtils.radToDeg(altitudeRad);

    // For azimuth, use longitude axis Z direction as north reference
    const northRef = new THREE.Vector3(0, 0, 1);
    longAxisRef.localToWorld(northRef);
    northRef.sub(longAxisRef.getWorldPosition(new THREE.Vector3())).normalize();

    // Project star direction onto horizontal plane
    const toStarHorizontal = toStar
      .clone()
      .sub(localUp.clone().multiplyScalar(toStar.dot(localUp)))
      .normalize();

    // Project north onto horizontal plane
    const northHorizontal = northRef
      .clone()
      .sub(localUp.clone().multiplyScalar(northRef.dot(localUp)))
      .normalize();

    // East is perpendicular to north
    const eastHorizontal = new THREE.Vector3()
      .crossVectors(localUp, northHorizontal)
      .normalize();

    // Calculate azimuth angle from north
    const azimuthRad = Math.atan2(
      toStarHorizontal.dot(eastHorizontal),
      toStarHorizontal.dot(northHorizontal)
    );
    const azimuthDeg = THREE.MathUtils.radToDeg(azimuthRad);

    console.log("Altitude:", altitudeDeg, "Azimuth:", azimuthDeg);

    setPlanCamAngle(altitudeDeg);
    setPlanCamDirection(azimuthDeg);
  }, [selectedStarPosition, selectedStarHR, scene]);

  if (!planetCamera) return null;

  return null;
}
