import { useEffect, useLayoutEffect, useRef } from "react";
import { CameraHelper, Vector3 } from "three";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { useStore } from "../../store";
import { useSettingsStore } from "../../store";
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
import { Ground } from "./Ground";

export default function PlanetCamera() {
  const planetCamRef = useRef(null);
  const planetCamSystemRef = useRef(null);
  const longAxisRef = useRef(null);
  const latAxisRef = useRef(null);
  const camMountRef = useRef(null);
  const groundMountRef = useRef(null);
  const targetObjRef = useRef(null);
  const prevTargetRef = useRef(null); // ADD THIS LINE

  const { scene } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);

  const cameraTransitioning = useStore((s) => s.cameraTransitioning);

  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  const planCamLat = usePlanetCameraStore((s) => s.planCamLat);
  const planCamLong = usePlanetCameraStore((s) => s.planCamLong);
  const planCamHeight = usePlanetCameraStore((s) => s.planCamHeight);
  const planCamAngle = usePlanetCameraStore((s) => s.planCamAngle);
  const planCamDirection = usePlanetCameraStore((s) => s.planCamDirection);
  const planCamFov = usePlanetCameraStore((s) => s.planCamFov);
  const planCamFar = usePlanetCameraStore((s) => s.planCamFar);

  const groundHeight = kmToUnits(usePlanetCameraStore((s) => s.groundHeight));
  const showGround = usePlanetCameraStore((s) => s.showGround);

  const getSetting = useSettingsStore((s) => s.getSetting);
  const planetSettings = getSetting(planetCameraTarget);
  const planetRadiusInUnits = planetSettings?.actualSize || 0.00426;
  const planetRadiusKm = unitsToKm(planetRadiusInUnits);

  useLayoutEffect(() => {
    // Reset previous target's opacity if it exists
    if (prevTargetRef.current && prevTargetRef.current.material) {
      prevTargetRef.current.material.opacity = 1;
      prevTargetRef.current.material.needsUpdate = true;
    }

    // Remove camera system from previous parent
    if (planetCamSystemRef.current.parent) {
      planetCamSystemRef.current.parent.remove(planetCamSystemRef.current);
    }

    // Add to new planet
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    if (targetObjRef.current) {
      targetObjRef.current.add(planetCamSystemRef.current);
      planetCamRef.current.updateProjectionMatrix();
    }

    // Store current target for next switch
    prevTargetRef.current = targetObjRef.current;
  }, [planetCameraTarget, scene]);

  useHelper(
    planetCameraHelper && !planetCamera ? planetCamRef : false,
    CameraHelper
  );

  useEffect(() => {
    if (groundMountRef.current) {
      groundMountRef.current.traverse((child) => {
        if (child.isMesh && child.geometry) {
          if (child.geometry.type === "SphereGeometry") {
            // Only control the sphere visibility, leave torus alone
            child.visible = showGround;
          }
          // TorusGeometry is left unchanged - always visible
        }
      });
    }
  }, [showGround]);

  useEffect(() => {
    if (!latAxisRef.current || cameraTransitioning) return; // Skip opacity changes during transition

    if (targetObjRef.current && targetObjRef.current.material) {
      // Dynamic transition based on planet radius - relative scaling
      const lowHeight = planetRadiusKm * 1.03; // Start fade at 3% above surface
      const highHeight = planetRadiusKm * 1.04; // End fade at 4% above surface

      let planetOpacity, groundOpacity;

      if (planCamHeight <= lowHeight) {
        planetOpacity = 0;
        groundOpacity = 1;
      } else if (planCamHeight >= highHeight) {
        planetOpacity = 1;
        groundOpacity = 0;
      } else {
        const fadeProgress =
          (planCamHeight - lowHeight) / (highHeight - lowHeight);
        const aggressiveFade = Math.pow(fadeProgress, 3);
        planetOpacity = aggressiveFade;
        groundOpacity = 1 - aggressiveFade;
      }

      // Apply opacity to planet
      targetObjRef.current.material.opacity = planetOpacity;
      targetObjRef.current.material.needsUpdate = true;

      // Apply opacity to ground
      if (groundMountRef.current) {
        groundMountRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = groundOpacity;
            child.material.needsUpdate = true;
          }
        });

        // Control visibility for performance
        groundMountRef.current.visible = groundOpacity > 0;
      }
      if (!planetCamera) {
        // Get all settings for celestial objects
        const { settings } = useSettingsStore.getState();

        // Reset only planets that have planetCamera enabled
        settings.forEach((setting) => {
          if (setting.planetCamera === true) {
            const planetObj = scene.getObjectByName(setting.name);
            if (planetObj && planetObj.material) {
              planetObj.material.opacity = 1;
              planetObj.material.needsUpdate = true;
            }
          }
        });

        // Hide ground
        if (groundMountRef.current) {
          groundMountRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.opacity = 0;
              child.material.needsUpdate = true;
            }
          });
        }
      }

      if (!showGround) {
        // Hide planet
        targetObjRef.current.material.opacity = 0;
        targetObjRef.current.material.needsUpdate = true;
      }
    }

    planetCamRef.current.updateProjectionMatrix();
  }, [planCamHeight, planetCamera, planetRadiusKm, showGround]);

  useEffect(() => {
    if (!latAxisRef.current) return;
    latAxisRef.current.rotation.x = latToRad(planCamLat);
    longAxisRef.current.rotation.y = longToRad(planCamLong);
    camMountRef.current.position.y = kmToUnits(planCamHeight);
    planetCamRef.current.rotation.x = altToRad(planCamAngle);
    planetCamRef.current.rotation.y = dirToRad(planCamDirection);
    planetCamRef.current.fov = planCamFov;
    planetCamRef.current.far = lyToUnits(planCamFar);

    planetCamRef.current.updateProjectionMatrix();
  }, [
    planCamLat,
    planCamLong,
    planCamHeight,
    planCamAngle,
    planCamDirection,
    planCamFov,
    planCamFar,
    latAxisRef,
  ]);

  useEffect(() => {
    // Reset camera to surface when switching planets
    const setPlanCamHeight = usePlanetCameraStore.getState().setPlanCamHeight;
    setPlanCamHeight(planetRadiusKm);
  }, [planetCameraTarget, planetRadiusKm]);

  return (
    <>
      <group ref={planetCamSystemRef} rotation={[0, 0, 0]}>
        <group ref={longAxisRef}>
          <group ref={latAxisRef}>
            <group
              ref={groundMountRef}
              position={[0, kmToUnits(planetRadiusKm) + groundHeight, 0]}
            >
              <Ground />
            </group>
            <group ref={camMountRef} position={[0, 0, 0]}>
              {/* Camera */}
              <group>
                <PerspectiveCamera
                  name="PlanetCamera"
                  rotation={[0, Math.PI, 0]}
                  near={0.00007}
                  makeDefault={planetCamera && !cameraTransitioning}
                  ref={planetCamRef}
                  rotation-order={"YXZ"}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
