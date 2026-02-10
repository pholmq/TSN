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
  const prevTargetRef = useRef(null);

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

  // --- START NEW SCALING LOGIC ---
  const setStarScale = useStore((s) => s.setStarScale);
  const initialStarScaleRef = useRef(useStore.getState().starScale);

  useEffect(() => {
    // Calculate zoom ratio (Base FOV 45)
    const rawRatio = 45 / planCamFov;

    // Dampen the ratio using a power curve (Square Root).
    // If you zoom in 100x:
    // - Linear: Stars get 100x bigger
    // - Sqrt: Stars get 10x bigger (Much smoother/slight increase)
    const dampenedRatio = Math.pow(rawRatio, 0.5);

    const dynamicScale = initialStarScaleRef.current * dampenedRatio;

    setStarScale(dynamicScale);
  }, [planCamFov, setStarScale]);

  // Reset scale on unmount
  useEffect(() => {
    return () => {
      setStarScale(initialStarScaleRef.current);
    };
  }, [setStarScale]);
  // --- END NEW SCALING LOGIC ---

  useLayoutEffect(() => {
    if (prevTargetRef.current && prevTargetRef.current.material) {
      prevTargetRef.current.material.opacity = 1;
      prevTargetRef.current.material.needsUpdate = true;
    }

    if (planetCamSystemRef.current.parent) {
      planetCamSystemRef.current.parent.remove(planetCamSystemRef.current);
    }

    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    if (targetObjRef.current) {
      targetObjRef.current.add(planetCamSystemRef.current);
      planetCamRef.current.updateProjectionMatrix();
    }

    prevTargetRef.current = targetObjRef.current;
  }, [planetCameraTarget, scene]);

  useEffect(() => {
    if (groundMountRef.current) {
      groundMountRef.current.traverse((child) => {
        if (child.isMesh && child.geometry) {
          if (child.geometry.type === "SphereGeometry") {
            child.visible = showGround;
          }
        }
      });
    }
  }, [showGround]);

  useEffect(() => {
    if (!latAxisRef.current || cameraTransitioning) return;

    if (targetObjRef.current && targetObjRef.current.material) {
      const lowHeight = planetRadiusKm * 1.0005;
      const highHeight = planetRadiusKm * 1.001;

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

      targetObjRef.current.material.opacity = planetOpacity;
      targetObjRef.current.material.needsUpdate = true;

      if (groundMountRef.current) {
        groundMountRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.opacity = groundOpacity;
            child.material.needsUpdate = true;
          }
        });
        groundMountRef.current.visible = groundOpacity > 0;
      }
      if (!planetCamera) {
        const { settings } = useSettingsStore.getState();
        settings.forEach((setting) => {
          if (setting.planetCamera === true) {
            const planetObj = scene.getObjectByName(setting.name);
            if (planetObj && planetObj.material) {
              planetObj.material.opacity = 1;
              planetObj.material.needsUpdate = true;
            }
          }
        });

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
