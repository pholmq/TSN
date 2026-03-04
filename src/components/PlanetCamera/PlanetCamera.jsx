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
  const groundFade = useRef(0);

  const CAM_NEAR_UNITS = 0.00007;

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

  const setStarScale = useStore((s) => s.setStarScale);
  const originalScaleRef = useRef(null);

  // 1. CAPTURE & RESTORE EFFECT
  useEffect(() => {
    if (planetCamera) {
      originalScaleRef.current = useStore.getState().starScale;
    }

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
    // Reset the atmospheric fade-in whenever a transition starts,
    // OR whenever the target planet changes abruptly.
    groundFade.current = 0;
  }, [cameraTransitioning, planetCameraTarget]);

  // 3. OPTIMIZED CROSSFADE (Decoupled Fades & Horizon Toggle)
  useFrame((_, delta) => {
    if (cameraTransitioning) return;

    if (!planetCamera && targetObjRef.current?.material) {
      targetObjRef.current.material.opacity = 1;
      if (groundMountRef.current) groundMountRef.current.visible = false;
      return;
    }

    const nearClipKm = unitsToKm(CAM_NEAR_UNITS);

    // PLANET FADE: Fades in early so the true curved horizon appears in front of the bowl
    const pLow = planetRadiusKm * 1.0005; // ~3km (Starts fading in)
    const pHigh = planetRadiusKm * 1.002; // ~12km (Fully opaque)

    // GROUND FADE: Fades out much later to patch the clipping hole beneath the camera
    const gLow = planetRadiusKm + nearClipKm * 0.8; // ~80km (Starts fading out)
    const gHigh = planetRadiusKm + nearClipKm * 2.0; // ~200km (Fully gone)

    // Calculate independent opacities
    let pOpacity =
      planCamHeight <= pLow
        ? 0
        : planCamHeight >= pHigh
        ? 1
        : Math.pow((planCamHeight - pLow) / (pHigh - pLow), 2); // Squared for smooth entry

    let gOpacity =
      planCamHeight <= gLow
        ? 1
        : planCamHeight >= gHigh
        ? 0
        : 1 - Math.pow((planCamHeight - gLow) / (gHigh - gLow), 2);

    // Apply Planet Visibility
    if (targetObjRef.current?.material) {
      targetObjRef.current.material.transparent = true;
      // CORRECT: Planet is completely hidden (0) when showGround is false
      targetObjRef.current.material.opacity = showGround ? pOpacity : 0;
    }

    // Apply Ground & Horizon Line Visibility
    if (planetCamera) {
      if (groundFade.current < 1) {
        groundFade.current = Math.min(1, groundFade.current + delta * 0.4);
      }

      if (groundMountRef.current) {
        if (gOpacity > 0) {
          groundMountRef.current.traverse((child) => {
            if (child.isMesh && child.material) {
              const baseOpacity = child.userData.baseOpacity || 1;
              const isBowl = child.userData.isBowl;

              // LOGIC: If showGround is unchecked, force the bowl to 0 opacity,
              // but let the horizon line render normally based on altitude!
              let finalOpacity = 0;
              if (!showGround && isBowl) {
                finalOpacity = 0;
              } else {
                finalOpacity = baseOpacity * groundFade.current * gOpacity;
              }

              child.material.transparent = true;
              child.material.opacity = finalOpacity;
              // Minor optimization: hide the mesh entirely if it is fully transparent
              child.visible = finalOpacity > 0;
            }
          });
          groundMountRef.current.visible = true;
        } else {
          groundMountRef.current.visible = false;
        }
      }
    } else if (groundMountRef.current) {
      groundMountRef.current.visible = false;
    }
  });

  // 4. COORDINATES & DIP TRACKING
  useEffect(() => {
    if (!latAxisRef.current) return;
    latAxisRef.current.rotation.x = latToRad(planCamLat);
    longAxisRef.current.rotation.y = longToRad(planCamLong);

    const camY = kmToUnits(planCamHeight);
    camMountRef.current.position.y = camY;

    if (groundMountRef.current) {
      const H = planCamHeight;
      const R = planetRadiusKm;

      const dipAngleRad = H > R ? Math.acos(R / H) : 0;
      const groundSizeUnits = 0.015;

      // FIX: Use Math.tan to perfectly sync the visual angle for smaller planets
      const yDropUnits = groundSizeUnits * Math.tan(dipAngleRad);

      groundMountRef.current.position.y = camY - yDropUnits;
    }

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
    planetRadiusKm,
  ]);

  return (
    <group ref={planetCamSystemRef}>
      <group ref={longAxisRef}>
        <group ref={latAxisRef}>
          <group
            ref={groundMountRef}
            position={[0, kmToUnits(planetRadiusKm), 0]}
          >
            <Ground />
          </group>
          <group ref={camMountRef}>
            <PerspectiveCamera
              name="PlanetCamera"
              rotation={[0, Math.PI, 0]}
              near={CAM_NEAR_UNITS}
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
