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
  const planetRadiusKm = unitsToKm(
    useSettingsStore.getState().getSetting(planetCameraTarget)?.actualSize ||
      0.00426
  );
  const groundHeight = kmToUnits(usePlanetCameraStore((s) => s.groundHeight));

  const setStarScale = useStore((s) => s.setStarScale);
  const initialStarScaleRef = useRef(useStore.getState().starScale);

  useEffect(() => {
    const rawRatio = 45 / planCamFov;
    const dampenedRatio = Math.pow(rawRatio, 0.5);
    setStarScale(initialStarScaleRef.current * dampenedRatio);
  }, [planCamFov, setStarScale]);

  useLayoutEffect(() => {
    if (planetCamSystemRef.current.parent)
      planetCamSystemRef.current.parent.remove(planetCamSystemRef.current);
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    if (targetObjRef.current)
      targetObjRef.current.add(planetCamSystemRef.current);
  }, [planetCameraTarget, scene]);

  useEffect(() => {
    if (cameraTransitioning) groundFade.current = 0;
  }, [cameraTransitioning]);

  useFrame((_, delta) => {
    if (
      !cameraTransitioning &&
      planetCamera &&
      showGround &&
      groundFade.current < 1
    ) {
      groundFade.current = Math.min(1, groundFade.current + delta * 0.4);
      if (groundMountRef.current) {
        groundMountRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true;
            child.material.opacity = groundFade.current;
          }
        });
        groundMountRef.current.visible = true;
      }
    }
  });

  useEffect(() => {
    if (!latAxisRef.current || cameraTransitioning) return;

    if (targetObjRef.current?.material) {
      const low = planetRadiusKm * 1.0005,
        high = planetRadiusKm * 1.001;
      let pOpacity =
        planCamHeight <= low
          ? 0
          : planCamHeight >= high
          ? 1
          : Math.pow((planCamHeight - low) / (high - low), 3);
      let gOpacity = 1 - pOpacity;

      // Visibility Rules
      targetObjRef.current.material.transparent = true;
      targetObjRef.current.material.opacity = showGround ? pOpacity : 0;
      targetObjRef.current.material.needsUpdate = true;

      if (groundMountRef.current) {
        if (showGround && groundFade.current >= 1) {
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
    }

    if (!planetCamera && targetObjRef.current?.material) {
      targetObjRef.current.material.opacity = 1;
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
