import { useEffect, useRef, useLayoutEffect, useState } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { useStore, useSettingsStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import {
  latToRad,
  longToRad,
  kmToUnits,
  unitsToKm,
  lyToUnits,
  altToRad,
  dirToRad,
} from "../../utils/celestial-functions";

export default function PlanetCameraMarker() {
  const markerRef = useRef(null);
  const markerSystemRef = useRef(null);
  const longAxisRef = useRef(null);
  const latAxisRef = useRef(null);
  const camMountRef = useRef(null);
  const dummyCamRef = useRef(null);

  const { scene } = useThree();

  // Stores
  const planetCamera = useStore((s) => s.planetCamera); // Is the camera active?
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  // Camera Position Data
  const planCamLat = usePlanetCameraStore((s) => s.planCamLat);
  const planCamLong = usePlanetCameraStore((s) => s.planCamLong);
  const planCamHeight = usePlanetCameraStore((s) => s.planCamHeight);
  const planCamAngle = usePlanetCameraStore((s) => s.planCamAngle);
  const planCamDirection = usePlanetCameraStore((s) => s.planCamDirection);
  const planCamFov = usePlanetCameraStore((s) => s.planCamFov);
  const planCamFar = usePlanetCameraStore((s) => s.planCamFar);

  // Helper to visualize the frustum (optional)
  useHelper(!planetCamera ? dummyCamRef : false, THREE.CameraHelper);

  // Planet Radius Logic
  const getSetting = useSettingsStore((s) => s.getSetting);
  const planetSettings = getSetting(planetCameraTarget);
  const planetRadiusInUnits = planetSettings?.actualSize || 0.00426;
  const planetRadiusKm = unitsToKm(planetRadiusInUnits);

  // 1. Attach to the target planet (same logic as PlanetCamera.jsx)
  useLayoutEffect(() => {
    const targetObj = scene.getObjectByName(planetCameraTarget);

    if (targetObj && markerSystemRef.current) {
      // Remove from previous parent if exists
      if (markerSystemRef.current.parent) {
        markerSystemRef.current.parent.remove(markerSystemRef.current);
      }
      // Add to new planet target
      targetObj.add(markerSystemRef.current);
    }

    return () => {
      // Cleanup: remove from parent on unmount
      if (markerSystemRef.current && markerSystemRef.current.parent) {
        markerSystemRef.current.parent.remove(markerSystemRef.current);
      }
    };
  }, [planetCameraTarget, scene]);

  // 2. Update Position/Rotation (same logic as PlanetCamera.jsx)
  useFrame(() => {
    if (
      !latAxisRef.current ||
      !longAxisRef.current ||
      !camMountRef.current ||
      !markerRef.current
    )
      return;

    // Apply Coordinates
    latAxisRef.current.rotation.x = latToRad(planCamLat);
    longAxisRef.current.rotation.y = longToRad(planCamLong);
    camMountRef.current.position.y = kmToUnits(planCamHeight);

    // Apply Camera Orientation
    markerRef.current.rotation.x = altToRad(planCamAngle);
    markerRef.current.rotation.y = dirToRad(planCamDirection);

    // Update Dummy Camera for Frustum Helper
    if (dummyCamRef.current) {
      dummyCamRef.current.fov = planCamFov;
      dummyCamRef.current.far = lyToUnits(planCamFar);
      dummyCamRef.current.updateProjectionMatrix();
    }
  });

  // If the Planet Camera is active, we hide the marker so it doesn't block the view
  if (planetCamera) return null;

  return (
    <group ref={markerSystemRef}>
      <group ref={longAxisRef}>
        <group ref={latAxisRef}>
          <group ref={camMountRef}>
            {/* The Rotated Marker Group */}
            <group ref={markerRef} rotation-order="YXZ">
              {/* Visual Mesh: A stylized camera */}
              <group scale={[0.5, 0.5, 0.5]}>
                {" "}
                {/* Adjust scale as needed */}
                {/* Body */}
                <mesh position={[0, 0, 0.2]}>
                  <boxGeometry args={[0.4, 0.3, 0.6]} />
                  <meshStandardMaterial color="orange" roughness={0.4} />
                </mesh>
                {/* Lens */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.2]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                {/* Viewfinder / Detail */}
                <mesh position={[0, 0.2, 0]}>
                  <boxGeometry args={[0.1, 0.1, 0.4]} />
                  <meshStandardMaterial color="#444" />
                </mesh>
              </group>

              {/* Invisible Dummy Camera for the Helper lines */}
              <PerspectiveCamera
                ref={dummyCamRef}
                position={[0, 0, 0]}
                rotation={[0, Math.PI, 0]} // Flip to match PlanetCamera orientation
                rotation-order="YXZ"
                near={0.00007}
                far={lyToUnits(planCamFar)}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
