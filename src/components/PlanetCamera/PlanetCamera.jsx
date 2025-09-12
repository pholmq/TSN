import { useEffect, useLayoutEffect, useRef } from "react";
import { CameraHelper, Vector3 } from "three";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { useStore } from "../../store";
import {
  latToRad,
  longToRad,
  kmToUnits,
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

  const { scene } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  const planetCameraTarget = useStore((s) => s.planetCameraTarget);

  const planCamLat = useStore((s) => s.planCamLat);
  const planCamLong = useStore((s) => s.planCamLong);
  const planCamHeight = useStore((s) => s.planCamHeight);
  const planCamAngle = useStore((s) => s.planCamAngle);
  const planCamDirection = useStore((s) => s.planCamDirection);
  const planCamFov = useStore((s) => s.planCamFov);
  const planCamFar = useStore((s) => s.planCamFar);

  const groundHeight = kmToUnits(useStore((s) => s.groundHeight));

  useLayoutEffect(() => {
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    targetObjRef.current.add(planetCamSystemRef.current);
    planetCamRef.current.updateProjectionMatrix();
  }, [planetCameraTarget]);

  useHelper(
    planetCameraHelper && !planetCamera ? planetCamRef : false,
    CameraHelper
  );

  useEffect(() => {
    if (!latAxisRef.current) return;

    if (targetObjRef.current && targetObjRef.current.material) {
      // Swift transition around 6600km - much narrower zone
      const lowHeight = 6580; // Start transition
      const highHeight = 6620; // End transition (40km range for swift fade)

      // Calculate fade factor (0 to 1)
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
        // More aggressive curve for sharper transition
        const aggressiveFade = Math.pow(fadeProgress, 3); // Cubic curve for swift change
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
        //Show planet and hide ground if planet camera is inactive
        targetObjRef.current.material.opacity = 1;
        targetObjRef.current.material.needsUpdate = true;
        if (groundMountRef.current) {
          groundMountRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.opacity = 0;
              child.material.needsUpdate = true;
            }
          });
        }
      }
    }

    planetCamRef.current.updateProjectionMatrix();
  }, [planCamHeight, planetCamera]);

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

  return (
    <>
      <group ref={planetCamSystemRef} rotation={[0, 0, 0]}>
        <group ref={longAxisRef}>
          <group ref={latAxisRef}>
            <group ref={groundMountRef} position={[0, groundHeight, 0]}>
              <Ground />
            </group>
            <group ref={camMountRef} position={[0, 0, 0]}>
              {/* Camera */}
              <group>
                <PerspectiveCamera
                  name="PlanetCamera"
                  rotation={[0, Math.PI, 0]}
                  near={0.00007}
                  makeDefault={planetCamera}
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
