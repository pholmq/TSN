import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
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

  const groundFade = useRef(0);

  const { scene } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  const {
    planCamLat,
    planCamLong,
    planCamHeight,
    planCamAngle,
    planCamDirection,
    planCamFov,
    planCamFar,
    showGround,
  } = usePlanetCameraStore();

  const groundHeight = kmToUnits(usePlanetCameraStore((s) => s.groundHeight));
  const getSetting = useSettingsStore((s) => s.getSetting);
  const planetRadiusKm = unitsToKm(
    getSetting(planetCameraTarget)?.actualSize || 0.00426
  );

  // FIXED STAR ZOOM LOGIC
  const setStarScale = useStore((s) => s.setStarScale);
  const initialStarScaleRef = useRef(useStore.getState().starScale);

  useEffect(() => {
    // Baseline ratio from FOV 45
    const dampenedRatio = Math.pow(45 / planCamFov, 0.5);
    setStarScale(initialStarScaleRef.current * dampenedRatio);
  }, [planCamFov, setStarScale]);

  useLayoutEffect(() => {
    if (prevTargetRef.current?.material)
      prevTargetRef.current.material.opacity = 1;
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    if (targetObjRef.current)
      targetObjRef.current.add(planetCamSystemRef.current);
    prevTargetRef.current = targetObjRef.current;
  }, [planetCameraTarget, scene]);

  useEffect(() => {
    if (cameraTransitioning) groundFade.current = 0;
  }, [cameraTransitioning]);

  useFrame((_, delta) => {
    if (!cameraTransitioning && planetCamera && groundFade.current < 1) {
      groundFade.current = Math.min(1, groundFade.current + delta * 0.4);
      if (groundMountRef.current) {
        groundMountRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = groundFade.current;
            child.material.needsUpdate = true;
          }
        });
        groundMountRef.current.visible = true;
      }
    }
  });

  // Height-based Visibility logic
  useEffect(() => {
    if (!latAxisRef.current || cameraTransitioning || groundFade.current < 1)
      return;

    if (targetObjRef.current?.material) {
      const lowHeight = planetRadiusKm * 1.0005;
      const highHeight = planetRadiusKm * 1.001;
      let pOpacity, gOpacity;

      if (planCamHeight <= lowHeight) {
        pOpacity = 0;
        gOpacity = 1;
      } else if (planCamHeight >= highHeight) {
        pOpacity = 1;
        gOpacity = 0;
      } else {
        const prog = (planCamHeight - lowHeight) / (highHeight - lowHeight);
        pOpacity = Math.pow(prog, 3);
        gOpacity = 1 - pOpacity;
      }

      // Update Planet Visibility
      targetObjRef.current.material.transparent = true;
      targetObjRef.current.material.opacity = showGround ? pOpacity : 1.0;
      targetObjRef.current.material.needsUpdate = true;

      // Update Ground Visibility
      if (groundMountRef.current) {
        if (showGround) {
          groundMountRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.transparent = true;
              child.material.opacity = gOpacity;
            }
          });
          groundMountRef.current.visible = gOpacity > 0;
        } else {
          groundMountRef.current.visible = false;
        }
      }

      if (!planetCamera) {
        targetObjRef.current.material.opacity = 1;
        if (groundMountRef.current) groundMountRef.current.visible = false;
      }
    }
  }, [
    planCamHeight,
    planetCamera,
    planetRadiusKm,
    showGround,
    cameraTransitioning,
  ]);

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
  ]);

  return (
    <group ref={planetCamSystemRef}>
      <group ref={longAxisRef}>
        <group ref={latAxisRef}>
          <group
            ref={groundMountRef}
            position={[0, kmToUnits(planetRadiusKm) + groundHeight, 0]}
            visible={showGround}
          >
            <Ground />
          </group>
          <group ref={camMountRef}>
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
  );
}
