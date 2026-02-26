import { useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

// ==========================================
// ADJUSTABLE CONSTANTS
// ==========================================
const BASE_DURATION = 10.0;
const ORBIT_PHASE_END = 0.45;
const FOV_BLEND_START = 0.65; // Delay FOV change until 65% through the animation
const LANDING_BRAKE_POWER = 12;
const RUNWAY_LENGTH = 0.25;
const CROSSFADE_START = 0.9;

export default function TransitionCamera() {
  const { scene } = useThree();
  const transitionCamRef = useRef(null);

  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);
  const setCameraTransitioning = useStore((s) => s.setCameraTransitioning);
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  const progress = useRef(0);
  const initialized = useRef(false);

  // Pre-allocate everything to avoid memory leaks and stutter
  const cache = useMemo(
    () => ({
      startPos: new THREE.Vector3(),
      startQuat: new THREE.Quaternion(),
      endPos: new THREE.Vector3(),
      endQuat: new THREE.Quaternion(),

      midPos: new THREE.Vector3(),
      p1: new THREE.Vector3(),
      p2: new THREE.Vector3(),
      planetCenter: new THREE.Vector3(),

      vStart: new THREE.Vector3(),
      vMid: new THREE.Vector3(),
      vCurrent: new THREE.Vector3(),
      dir: new THREE.Vector3(),

      orbitAxis: new THREE.Vector3(),
      orbitAngle: 0,
      lookTarget: new THREE.Vector3(),
      sightTarget: new THREE.Vector3(),

      defaultUp: new THREE.Vector3(0, 1, 0),
      endUp: new THREE.Vector3(),
      blendedUp: new THREE.Vector3(),
      trackingQuat: new THREE.Quaternion(),

      startFov: 50,
      endFov: 50,
      orbitDistance: 0,
      curve: new THREE.CubicBezierCurve3(),
    }),
    []
  );

  useEffect(() => {
    if (planetCamera) setCameraTransitioning(true);
  }, [planetCamera, setCameraTransitioning]);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (e.button === 0 && cameraTransitioning) {
        progress.current = 1.0;
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [cameraTransitioning]);

  useLayoutEffect(() => {
    if (cameraTransitioning && transitionCamRef.current) {
      initialized.current = false;

      const orbitCam = scene.getObjectByName("OrbitCamera");
      const planetCam = scene.getObjectByName("PlanetCamera");
      const planetObj = scene.getObjectByName(planetCameraTarget);

      if (!orbitCam || !planetCam || !planetObj) return;

      orbitCam.updateMatrixWorld(true);
      planetCam.updateMatrixWorld(true);
      planetObj.updateMatrixWorld(true);

      if (planetObj.material) {
        planetObj.material.transparent = true;
        planetObj.material.opacity = 1;
        planetObj.material.needsUpdate = true;
      }

      orbitCam.getWorldPosition(cache.startPos);
      orbitCam.getWorldQuaternion(cache.startQuat);
      planetCam.getWorldPosition(cache.endPos);
      planetCam.getWorldQuaternion(cache.endQuat);
      planetObj.getWorldPosition(cache.planetCenter);

      planetCam.getWorldDirection(cache.dir);
      cache.endUp.set(0, 1, 0).applyQuaternion(cache.endQuat);

      cache.startFov = orbitCam.fov;
      cache.endFov = planetCam.fov;
      cache.orbitDistance = cache.startPos.distanceTo(cache.planetCenter);

      // Phase 1: Orbit Target
      const aboveBehindDir = cache.dir
        .clone()
        .negate()
        .add(cache.endUp)
        .normalize();
      cache.midPos
        .copy(cache.planetCenter)
        .add(aboveBehindDir.multiplyScalar(cache.orbitDistance));

      // Phase 2: Landing Arc
      const backVector = cache.dir.clone().negate();
      cache.p2
        .copy(cache.endPos)
        .add(backVector.multiplyScalar(cache.orbitDistance * RUNWAY_LENGTH));
      cache.p1
        .copy(cache.midPos)
        .lerp(cache.p2, 0.5)
        .add(cache.endUp.clone().multiplyScalar(cache.orbitDistance * 0.3));

      cache.curve.v0.copy(cache.midPos);
      cache.curve.v1.copy(cache.p1);
      cache.curve.v2.copy(cache.p2);
      cache.curve.v3.copy(cache.endPos);

      // --- CALCULATE TRUE SPHERICAL ORBIT ---
      cache.vStart.subVectors(cache.startPos, cache.planetCenter).normalize();
      cache.vMid.subVectors(cache.midPos, cache.planetCenter).normalize();

      cache.orbitAngle = cache.vStart.angleTo(cache.vMid);
      cache.orbitAxis.crossVectors(cache.vStart, cache.vMid);

      // Safety fallback
      if (cache.orbitAxis.lengthSq() < 0.0001) {
        cache.orbitAxis.set(0, 1, 0).cross(cache.vStart);
        if (cache.orbitAxis.lengthSq() < 0.0001)
          cache.orbitAxis.set(1, 0, 0).cross(cache.vStart);
      }
      cache.orbitAxis.normalize();

      // Inherit initial state perfectly
      transitionCamRef.current.fov = cache.startFov;
      transitionCamRef.current.position.copy(cache.startPos);
      transitionCamRef.current.quaternion.copy(cache.startQuat);
      transitionCamRef.current.updateProjectionMatrix();

      progress.current = 0;
      initialized.current = true;
    } else {
      initialized.current = false;
    }
  }, [cameraTransitioning, scene, planetCameraTarget, cache]);

  const easeInOutQuad = (x) =>
    x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const glideBrakeEase = (x) => 1 - Math.pow(1 - x, LANDING_BRAKE_POWER);

  useFrame((_, delta) => {
    if (
      !cameraTransitioning ||
      !transitionCamRef.current ||
      !initialized.current
    )
      return;

    progress.current += delta / BASE_DURATION;

    if (progress.current >= 1.0) {
      progress.current = 1.0;
      setCameraTransitioning(false);

      const planetObj = scene.getObjectByName(planetCameraTarget);
      if (planetObj && planetObj.material) planetObj.material.opacity = 0;
      return;
    }

    const globalEase = easeInOutQuad(progress.current);

    // ==========================================
    // LIVE TARGET TRACKING
    // ==========================================
    const planetCam = scene.getObjectByName("PlanetCamera");
    if (planetCam) {
      planetCam.getWorldPosition(cache.endPos);
      planetCam.getWorldQuaternion(cache.endQuat);
      planetCam.getWorldDirection(cache.dir);
      cache.endUp.set(0, 1, 0).applyQuaternion(cache.endQuat);

      const backVector = cache.dir.clone().negate();
      cache.curve.v2
        .copy(cache.endPos)
        .add(backVector.multiplyScalar(cache.orbitDistance * RUNWAY_LENGTH));
      cache.curve.v3.copy(cache.endPos);

      cache.sightTarget
        .copy(cache.endPos)
        .add(cache.dir.clone().multiplyScalar(cache.orbitDistance * 2));
    }

    // ==========================================
    // FOV BLEND (DELAYED)
    // ==========================================
    let fovEase = 0;
    if (progress.current > FOV_BLEND_START) {
      const fovT =
        (progress.current - FOV_BLEND_START) / (1.0 - FOV_BLEND_START);
      fovEase = easeInOutQuad(fovT);
    }
    transitionCamRef.current.fov = THREE.MathUtils.lerp(
      cache.startFov,
      cache.endFov,
      fovEase
    );
    transitionCamRef.current.updateProjectionMatrix();

    // ==========================================
    // POSITIONING
    // ==========================================
    if (progress.current <= ORBIT_PHASE_END) {
      const localT = progress.current / ORBIT_PHASE_END;
      const t = easeInOutQuad(localT);

      cache.vCurrent
        .copy(cache.vStart)
        .applyAxisAngle(cache.orbitAxis, cache.orbitAngle * t);
      transitionCamRef.current.position
        .copy(cache.planetCenter)
        .add(cache.vCurrent.multiplyScalar(cache.orbitDistance));

      cache.lookTarget.copy(cache.planetCenter);
    } else {
      const localT =
        (progress.current - ORBIT_PHASE_END) / (1.0 - ORBIT_PHASE_END);
      const t = glideBrakeEase(localT);

      cache.curve.getPoint(t, transitionCamRef.current.position);

      const lookEase = easeInOutQuad(localT);
      cache.lookTarget
        .copy(cache.planetCenter)
        .lerp(cache.sightTarget, lookEase);
    }

    // ==========================================
    // ROTATION
    // ==========================================
    cache.blendedUp
      .copy(cache.defaultUp)
      .lerp(cache.endUp, globalEase)
      .normalize();
    transitionCamRef.current.up.copy(cache.blendedUp);
    transitionCamRef.current.lookAt(cache.lookTarget);
    cache.trackingQuat.copy(transitionCamRef.current.quaternion);

    if (progress.current < 0.05) {
      const blend = progress.current / 0.05;
      transitionCamRef.current.quaternion
        .copy(cache.startQuat)
        .slerp(cache.trackingQuat, blend);
    } else {
      transitionCamRef.current.quaternion.copy(cache.trackingQuat);
    }

    // ==========================================
    // GROUND & PLANET CROSSFADE (DYNAMIC)
    // ==========================================
    const planetObj = scene.getObjectByName(planetCameraTarget);

    // Find ground meshes implicitly by climbing up the tree from PlanetCamera
    const groundMeshes = [];
    if (planetCam && planetCam.parent && planetCam.parent.parent) {
      planetCam.parent.parent.traverse((child) => {
        // Force the parent groups to be visible (overriding PlanetCamera.jsx hiding logic)
        if (child.isGroup) child.visible = true;
        if (child.isMesh) groundMeshes.push(child);
      });
    }

    if (progress.current >= CROSSFADE_START) {
      const fadeBlend =
        (progress.current - CROSSFADE_START) / (1.0 - CROSSFADE_START);
      const aggressiveFade = Math.pow(fadeBlend, 3);

      if (planetObj && planetObj.material) {
        planetObj.material.opacity = 1.0 - aggressiveFade;
      }

      groundMeshes.forEach((mesh) => {
        mesh.visible = true;
        if (mesh.material) {
          mesh.material.transparent = true;
          // Torus geometry is the horizon, sphere is the solid ground
          if (mesh.geometry && mesh.geometry.type === "TorusGeometry") {
            mesh.material.opacity = aggressiveFade * 0.1;
          } else {
            mesh.material.opacity = aggressiveFade;
          }
        }
      });
    } else {
      if (planetObj && planetObj.material) planetObj.material.opacity = 1.0;
      groundMeshes.forEach((mesh) => {
        if (mesh.material) mesh.material.opacity = 0.0;
      });
    }
  });

  if (!cameraTransitioning) return null;

  return (
    <PerspectiveCamera
      ref={transitionCamRef}
      makeDefault={true}
      near={0.0001}
      far={10000000}
    />
  );
}
