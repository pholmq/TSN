import { useEffect, useMemo, useLayoutEffect, useRef } from "react";
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

  // Calculate altitude-based opacities globally so both hooks can use them
  const { pOpacity, gOpacity } = useMemo(() => {
    const low = planetRadiusKm * 1.0005;
    const high = planetRadiusKm * 1.001;
    let p =
      planCamHeight <= low
        ? 0
        : planCamHeight >= high
        ? 1
        : Math.pow((planCamHeight - low) / (high - low), 3);
    return { pOpacity: p, gOpacity: 1 - p };
  }, [planCamHeight, planetRadiusKm]);

  const setStarScale = useStore((s) => s.setStarScale);
  const originalScaleRef = useRef(null);

  // 1. CAPTURE & RESTORE EFFECT
  useEffect(() => {
    if (planetCamera) {
      // Capture the clean, normal star scale the exact moment the camera engages
      originalScaleRef.current = useStore.getState().starScale;
    }

    // CLEANUP FUNCTION: This is guaranteed to run when the component unmounts
    // or when planetCamera turns false, safely restoring the stars!
    return () => {
      if (planetCamera && originalScaleRef.current !== null) {
        setStarScale(originalScaleRef.current);
        originalScaleRef.current = null;
      }
    };
  }, [planetCamera, setStarScale]);

  // 2. DYNAMIC ZOOM EFFECT
  useEffect(() => {
    if (planetCamera && originalScaleRef.current !== null) {
      // Apply the dynamic FOV dampening against the clean base scale
      const rawRatio = 45 / planCamFov;
      const dampenedRatio = Math.pow(rawRatio, 0.5);
      setStarScale(originalScaleRef.current * dampenedRatio);
    }
  }, [planCamFov, planetCamera, setStarScale]);

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
        // ONLY show the ground if the altitude logic (gOpacity) allows it
        if (gOpacity > 0) {
          groundMountRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              const baseOpacity = child.userData.baseOpacity || 1;
              child.material.transparent = true;
              // Combine the fade-in animation WITH the altitude opacity
              child.material.opacity =
                baseOpacity * groundFade.current * gOpacity;
            }
          });
          groundMountRef.current.visible = true;
        } else {
          groundMountRef.current.visible = false;
        }
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
              const baseOpacity = child.userData.baseOpacity || 1; // Safely read the base opacity
              child.material.transparent = true;
              child.material.opacity = baseOpacity * gOpacity;
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
