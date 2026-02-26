import { useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

// Timeline Constants
const DUR = 10.0, ORBIT_PCT = 0.45, RUNWAY = 0.25, FADE_START = 0.90;

export default function TransitionCamera() {
  const { scene } = useThree();
  const cam = useRef(null);
  
  const planetCamera = useStore((s) => s.planetCamera);
  const { cameraTransitioning, setCameraTransitioning } = useStore();
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);

  // Pre-allocate everything strictly once to prevent memory leaks in useFrame
  const state = useMemo(() => ({
    t: 0, orbitDist: 0, startFov: 50, endFov: 50, angle: 0,
    startPos: new THREE.Vector3(), startQuat: new THREE.Quaternion(),
    endPos: new THREE.Vector3(), endQuat: new THREE.Quaternion(),
    center: new THREE.Vector3(), curve: new THREE.CubicBezierCurve3(),
    vStart: new THREE.Vector3(), vMid: new THREE.Vector3(), axis: new THREE.Vector3(),
    dir: new THREE.Vector3(), up: new THREE.Vector3(),
    
    // Live tracking vectors
    look: new THREE.Vector3(), sight: new THREE.Vector3(),
    vCur: new THREE.Vector3(), temp: new THREE.Vector3()
  }), []);

  useEffect(() => { if (planetCamera) setCameraTransitioning(true); }, [planetCamera, setCameraTransitioning]);

  useEffect(() => {
    const skip = (e) => e.button === 0 && cameraTransitioning && (state.t = 1.0);
    document.addEventListener("pointerdown", skip);
    return () => document.removeEventListener("pointerdown", skip);
  }, [cameraTransitioning, state]);

  useLayoutEffect(() => {
    if (!cameraTransitioning || !cam.current) return;
    
    const oCam = scene.getObjectByName("OrbitCamera");
    const pCam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);
    if (!oCam || !pCam || !pObj) return;

    [oCam, pCam, pObj].forEach((obj) => obj.updateMatrixWorld(true));
    if (pObj.material) { pObj.material.transparent = true; pObj.material.opacity = 1; }

    state.t = 0;
    oCam.getWorldPosition(state.startPos); oCam.getWorldQuaternion(state.startQuat);
    pCam.getWorldPosition(state.endPos); pCam.getWorldQuaternion(state.endQuat);
    pObj.getWorldPosition(state.center);

    pCam.getWorldDirection(state.dir);
    state.up.set(0, 1, 0).applyQuaternion(state.endQuat);
    
    state.startFov = oCam.fov; state.endFov = pCam.fov;
    state.orbitDist = state.startPos.distanceTo(state.center);

    // Phase 1 Target (Above/Behind)
    const mid = state.center.clone().add(state.dir.clone().negate().add(state.up).normalize().multiplyScalar(state.orbitDist));

    // Phase 2 Landing Curve
    const p2 = state.endPos.clone().add(state.dir.clone().multiplyScalar(-state.orbitDist * RUNWAY));
    const p1 = mid.clone().lerp(p2, 0.5).add(state.up.clone().multiplyScalar(state.orbitDist * 0.3));
    state.curve.v0.copy(mid); state.curve.v1.copy(p1); state.curve.v2.copy(p2); state.curve.v3.copy(state.endPos);

    // True Spherical Orbit Math
    state.vStart.subVectors(state.startPos, state.center).normalize();
    state.vMid.subVectors(mid, state.center).normalize();
    state.angle = state.vStart.angleTo(state.vMid);
    state.axis.crossVectors(state.vStart, state.vMid).normalize();

    // Snap to exact OrbitCamera start
    cam.current.fov = state.startFov;
    cam.current.position.copy(state.startPos);
    cam.current.quaternion.copy(state.startQuat);
    cam.current.updateProjectionMatrix();
  }, [cameraTransitioning, scene, target, state]);

  useFrame((_, delta) => {
    if (!cameraTransitioning || !cam.current) return;

    state.t += delta / DUR;
    
    if (state.t >= 1.0) {
      setCameraTransitioning(false);
      const pObj = scene.getObjectByName(target);
      if (pObj?.material) pObj.material.opacity = 0;
      return;
    }

    const ease = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    const globalT = ease(state.t);

    // Live Target Tracking
    const pCam = scene.getObjectByName("PlanetCamera");
    if (pCam) {
      pCam.getWorldPosition(state.endPos);
      pCam.getWorldDirection(state.dir);
      
      state.temp.copy(state.dir).multiplyScalar(-state.orbitDist * RUNWAY);
      state.curve.v2.copy(state.endPos).add(state.temp);
      state.curve.v3.copy(state.endPos);
    }

    // POSITION & LOOK TARGET
    if (state.t <= ORBIT_PCT) {
      const t = ease(state.t / ORBIT_PCT);
      state.vCur.copy(state.vStart).applyAxisAngle(state.axis, state.angle * t);
      cam.current.position.copy(state.center).add(state.vCur.multiplyScalar(state.orbitDist));
      state.look.copy(state.center);
    } else {
      const localT = (state.t - ORBIT_PCT) / (1 - ORBIT_PCT);
      const t = 1 - Math.pow(1 - localT, 12); // Extreme brake
      state.curve.getPoint(t, cam.current.position);
      
      state.temp.copy(state.dir).multiplyScalar(state.orbitDist * 2);
      state.sight.copy(state.endPos).add(state.temp);
      state.look.copy(state.center).lerp(state.sight, ease(localT));
    }

    // ROTATION & FOV
    cam.current.fov = THREE.MathUtils.lerp(state.startFov, state.endFov, state.t > 0.65 ? ease((state.t - 0.65) / 0.35) : 0);
    cam.current.updateProjectionMatrix();
    
    state.temp.set(0, 1, 0).lerp(state.up, globalT).normalize();
    cam.current.up.copy(state.temp);
    cam.current.lookAt(state.look);

    // DYNAMIC CROSSFADE
    if (state.t >= FADE_START) {
      const fade = Math.pow((state.t - FADE_START) / (1 - FADE_START), 3);
      
      const pObj = scene.getObjectByName(target);
      if (pObj?.material) pObj.material.opacity = 1 - fade;

      pCam?.parent?.parent?.traverse((child) => {
        if (child.isGroup) child.visible = true;
        if (child.isMesh && child.material) {
          child.visible = true;
          child.material.transparent = true;
          child.material.opacity = child.geometry?.type === "TorusGeometry" ? fade * 0.1 : fade;
        }
      });
    }
  });

  if (!cameraTransitioning) return null;
  return <PerspectiveCamera ref={cam} makeDefault near={0.0001} far={10000000} />;
}