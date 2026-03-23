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

  // PERFORMANCE FIX: Pre-cache the ground meshes to avoid traversing every frame
  const cachedGroundMeshes = useRef([]);

  const CAM_NEAR_UNITS = 0.0002;

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
    groundFade.current = 0;
  }, [cameraTransitioning, planetCameraTarget]);

  // PERFORMANCE FIX: Populate the cache array once when the ground mounts
  useEffect(() => {
    if (groundMountRef.current) {
      const meshes = [];
      groundMountRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          meshes.push({
            mesh: child,
            baseOpacity: child.userData.baseOpacity || 1,
            isBowl: child.userData.isBowl,
          });
        }
      });
      cachedGroundMeshes.current = meshes;
    }
  }, []);

  useFrame((_, delta) => {
    if (cameraTransitioning) return;

    if (!planetCamera && targetObjRef.current?.material) {
      targetObjRef.current.material.opacity = 1;
      if (groundMountRef.current) groundMountRef.current.visible = false;
      return;
    }

    const nearClipKm = unitsToKm(CAM_NEAR_UNITS);

    const pLow = planetRadiusKm * 1.0005;
    const pHigh = planetRadiusKm * 1.002;

    const gLow = planetRadiusKm + nearClipKm * 0.8;
    const gHigh = planetRadiusKm + nearClipKm * 2.0;

    let pOpacity =
      planCamHeight <= pLow
        ? 0
        : planCamHeight >= pHigh
        ? 1
        : Math.pow((planCamHeight - pLow) / (pHigh - pLow), 2);

    let gOpacity =
      planCamHeight <= gLow
        ? 1
        : planCamHeight >= gHigh
        ? 0
        : 1 - Math.pow((planCamHeight - gLow) / (gHigh - gLow), 2);

    if (targetObjRef.current?.material) {
      targetObjRef.current.material.transparent = true;
      targetObjRef.current.material.opacity = showGround ? pOpacity : 0;
    }

    if (planetCamera) {
      if (groundFade.current < 1) {
        groundFade.current = Math.min(1, groundFade.current + delta * 0.4);
      }

      if (groundMountRef.current) {
        if (gOpacity > 0) {
          // PERFORMANCE FIX: Loop through the flat array instead of traversing the whole tree
          const meshes = cachedGroundMeshes.current;
          for (let i = 0; i < meshes.length; i++) {
            const { mesh, baseOpacity, isBowl } = meshes[i];

            let finalOpacity = 0;
            if (!showGround && isBowl) {
              finalOpacity = 0;
            } else {
              finalOpacity = baseOpacity * groundFade.current * gOpacity;
            }

            mesh.material.transparent = true;
            mesh.material.opacity = finalOpacity;
            mesh.visible = finalOpacity > 0;
          }
          groundMountRef.current.visible = true;
        } else {
          groundMountRef.current.visible = false;
        }
      }
    } else if (groundMountRef.current) {
      groundMountRef.current.visible = false;
    }
  });

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
