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

  const groundFade = useRef(0); // For the slow entrance fade

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
  const planetRadiusKm = unitsToKm(
    useSettingsStore((s) => s.getSetting)(planetCameraTarget)?.actualSize ||
      0.00426
  );

  useEffect(() => {
    const dampenedRatio = Math.pow(45 / planCamFov, 0.5);
    useStore
      .getState()
      .setStarScale(useStore.getState().starScale * dampenedRatio);
  }, [planCamFov]);

  useLayoutEffect(() => {
    if (prevTargetRef.current?.material)
      prevTargetRef.current.material.opacity = 1;
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    if (targetObjRef.current)
      targetObjRef.current.add(planetCamSystemRef.current);
    prevTargetRef.current = targetObjRef.current;
  }, [planetCameraTarget, scene]);

  // Reset ground fade when a transition begins
  useEffect(() => {
    if (cameraTransitioning) groundFade.current = 0;
  }, [cameraTransitioning]);

  useFrame((_, delta) => {
    // Slow Fade In: Increase by delta * 0.4 (~2.5 seconds total)
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

  // Height-based Fade: Handover control only once the entry fade is done
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

      // Restore planet opacity logic
      targetObjRef.current.material.transparent = true;
      targetObjRef.current.material.opacity = pOpacity;
      targetObjRef.current.material.needsUpdate = true;

      if (groundMountRef.current) {
        groundMountRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = gOpacity;
          }
        });
        groundMountRef.current.visible = gOpacity > 0;
      }

      // Cleanup if planet camera is turned off
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
            visible={false}
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
