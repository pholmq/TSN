import { useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

const DUR = 12.0,
  ORBIT_PCT = 0.4,
  RUNWAY = 0.5;

export default function TransitionCamera() {
  const { scene } = useThree();
  const cam = useRef(null);
  const planetCamera = useStore((s) => s.planetCamera);
  const { cameraTransitioning, setCameraTransitioning } = useStore();
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);

  const state = useMemo(
    () => ({
      t: 0,
      orbitDist: 0,
      startFov: 50,
      endFov: 50,
      angle: 0,
      startPos: new THREE.Vector3(),
      startQuat: new THREE.Quaternion(),
      endPos: new THREE.Vector3(),
      endQuat: new THREE.Quaternion(),
      center: new THREE.Vector3(),
      curve: new THREE.CubicBezierCurve3(),
      vStart: new THREE.Vector3(),
      vMid: new THREE.Vector3(),
      axis: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      startUp: new THREE.Vector3(),
      endUp: new THREE.Vector3(),
      look: new THREE.Vector3(),
      sight: new THREE.Vector3(),
      vCur: new THREE.Vector3(),
      temp: new THREE.Vector3(),
    }),
    []
  );

  useEffect(() => {
    const skip = (e) => {
      if (e.button === 0 && cameraTransitioning) state.t = 1.0;
    };
    window.addEventListener("pointerdown", skip);
    return () => window.removeEventListener("pointerdown", skip);
  }, [cameraTransitioning, state]);

  useEffect(() => {
    if (planetCamera) setCameraTransitioning(true);
  }, [planetCamera, setCameraTransitioning]);

  useLayoutEffect(() => {
    if (!cameraTransitioning || !cam.current) return;
    const oCam = scene.getObjectByName("OrbitCamera");
    const pCam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);
    if (!oCam || !pCam || !pObj) return;

    [oCam, pCam, pObj].forEach((obj) => obj.updateMatrixWorld(true));

    state.t = 0;
    oCam.getWorldPosition(state.startPos);
    oCam.getWorldQuaternion(state.startQuat);
    pCam.getWorldPosition(state.endPos);
    pCam.getWorldQuaternion(state.endQuat);
    pObj.getWorldPosition(state.center);
    state.startUp.set(0, 1, 0).applyQuaternion(state.startQuat);
    state.endUp.set(0, 1, 0).applyQuaternion(state.endQuat);
    pCam.getWorldDirection(state.dir);
    state.startFov = oCam.fov;
    state.endFov = pCam.fov;
    state.orbitDist = state.startPos.distanceTo(state.center);

    const mid = state.center
      .clone()
      .add(
        state.dir
          .clone()
          .negate()
          .add(state.endUp)
          .normalize()
          .multiplyScalar(state.orbitDist)
      );
    const p2 = state.endPos
      .clone()
      .add(state.dir.clone().multiplyScalar(-state.orbitDist * RUNWAY));
    const p1 = mid
      .clone()
      .lerp(p2, 0.5)
      .add(state.endUp.clone().multiplyScalar(state.orbitDist * 0.4));
    state.curve.v0.copy(mid);
    state.curve.v1.copy(p1);
    state.curve.v2.copy(p2);
    state.curve.v3.copy(state.endPos);
    state.vStart.subVectors(state.startPos, state.center).normalize();
    state.vMid.subVectors(mid, state.center).normalize();
    state.angle = state.vStart.angleTo(state.vMid);
    state.axis.crossVectors(state.vStart, state.vMid).normalize();

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
      return;
    }

    const easeOutEx = (x) => 1 - Math.pow(1 - x, 6);
    const easeInOut = (x) =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    const globalT = easeInOut(state.t);

    const pCam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);
    if (pCam && pObj) {
      pCam.getWorldPosition(state.endPos);
      pCam.getWorldDirection(state.dir);
      pObj.getWorldPosition(state.center);
    }

    if (state.t <= ORBIT_PCT) {
      const t = easeInOut(state.t / ORBIT_PCT);
      state.vCur.copy(state.vStart).applyAxisAngle(state.axis, state.angle * t);
      cam.current.position
        .copy(state.center)
        .add(state.vCur.multiplyScalar(state.orbitDist));
    } else {
      const localT = (state.t - ORBIT_PCT) / (1 - ORBIT_PCT);
      const curveT = easeOutEx(localT);
      state.curve.getPoint(curveT, cam.current.position);
    }

    if (state.t < 0.85) {
      state.look.copy(state.center);
    } else {
      const lookT = easeInOut((state.t - 0.85) / 0.15);
      state.temp.copy(state.dir).multiplyScalar(state.orbitDist * 0.5);
      state.sight.copy(state.endPos).add(state.temp);
      state.look.copy(state.center).lerp(state.sight, lookT);
    }

    cam.current.fov = THREE.MathUtils.lerp(
      state.startFov,
      state.endFov,
      state.t > 0.7 ? easeInOut((state.t - 0.7) / 0.3) : 0
    );
    cam.current.updateProjectionMatrix();
    state.temp.copy(state.startUp).lerp(state.endUp, globalT).normalize();
    cam.current.up.copy(state.temp);
    cam.current.lookAt(state.look);
  });

  return (
    <PerspectiveCamera
      ref={cam}
      makeDefault={cameraTransitioning}
      near={0.0001}
      far={10000000}
    />
  );
}
