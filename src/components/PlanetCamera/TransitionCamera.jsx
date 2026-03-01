import { useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

const RUNWAY = 0.5;
const FLY_DUR = 8.0; 

export default function TransitionCamera() {
  const { scene } = useThree();
  const cam = useRef(null);
  const controlsRef = useRef(null);
  const planetCamera = useStore((s) => s.planetCamera);
  const { cameraTransitioning, setCameraTransitioning } = useStore();
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);
  const phase = useRef("IDLE");

  const state = useMemo(() => ({
    t: 0,
    orbitDist: 0,
    startFov: 50,
    endFov: 50,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    endPos: new THREE.Vector3(),
    endQuat: new THREE.Quaternion(),
    center: new THREE.Vector3(),
    curve: new THREE.CubicBezierCurve3(),
    dir: new THREE.Vector3(),
    startUp: new THREE.Vector3(),
    endUp: new THREE.Vector3(),
    look: new THREE.Vector3(),
    sight: new THREE.Vector3(),
    temp: new THREE.Vector3(),
  }), []);

  useEffect(() => {
    const skip = (e) => {
      if (e.button === 0 && cameraTransitioning) {
        if (controlsRef.current) controlsRef.current.enabled = false;
        phase.current = "IDLE";
        setCameraTransitioning(false);
      }
    };
    window.addEventListener("pointerdown", skip);
    return () => window.removeEventListener("pointerdown", skip);
  }, [cameraTransitioning, setCameraTransitioning]);

  useEffect(() => {
    if (planetCamera) setCameraTransitioning(true);
  }, [planetCamera, setCameraTransitioning]);

  useLayoutEffect(() => {
    if (!cameraTransitioning || !cam.current || !controlsRef.current) return;

    const oCam = scene.getObjectByName("OrbitCamera");
    const pCam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);
    if (!oCam || !pCam || !pObj) return;

    if (pObj.material) {
      pObj.material.transparent = true;
      pObj.material.opacity = 1.0;
      pObj.material.needsUpdate = true;
    }

    [oCam, pCam, pObj].forEach((obj) => obj.updateMatrixWorld(true));

    oCam.getWorldPosition(state.startPos);
    oCam.getWorldQuaternion(state.startQuat);
    pCam.getWorldPosition(state.endPos);
    pCam.getWorldQuaternion(state.endQuat);
    pObj.getWorldPosition(state.center);

    state.endUp.set(0, 1, 0).applyQuaternion(state.endQuat);
    pCam.getWorldDirection(state.dir);

    state.startFov = oCam.fov;
    state.endFov = pCam.fov;
    state.orbitDist = state.startPos.distanceTo(state.center);

    const mid = state.center.clone().add(
      state.dir.clone().negate().add(state.endUp).normalize().multiplyScalar(state.orbitDist)
    );

    const p2 = state.endPos.clone().add(state.dir.clone().multiplyScalar(-state.orbitDist * RUNWAY));
    const p1 = mid.clone().lerp(p2, 0.5).add(state.endUp.clone().multiplyScalar(state.orbitDist * 0.4));
    state.curve.v0.copy(mid);
    state.curve.v1.copy(p1);
    state.curve.v2.copy(p2);
    state.curve.v3.copy(state.endPos);

    cam.current.fov = state.startFov;
    cam.current.position.copy(state.startPos);
    cam.current.quaternion.copy(state.startQuat);
    cam.current.updateProjectionMatrix();

    const oCamForward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.startQuat).normalize();
    const initialLookAt = state.startPos.clone().add(oCamForward.multiplyScalar(state.orbitDist));

    phase.current = "ORBIT";
    controlsRef.current.enabled = true;
    
    // TWEAK: Decreased damping for a much snappier, faster orbit maneuver
    controlsRef.current.smoothTime = 0.6; 

    controlsRef.current.setLookAt(
      state.startPos.x, state.startPos.y, state.startPos.z,
      initialLookAt.x, initialLookAt.y, initialLookAt.z,
      false
    );

    controlsRef.current.setLookAt(
      mid.x, mid.y, mid.z,
      state.center.x, state.center.y, state.center.z,
      true
    ).then(() => {
      if (phase.current === "ORBIT") {
        phase.current = "FLY_IN";
        controlsRef.current.enabled = false;
        state.t = 0; 
        state.startUp.copy(cam.current.up); 
        state.startFov = cam.current.fov; 
      }
    });

  }, [cameraTransitioning, scene, target, state]);

  useFrame((_, delta) => {
    if (!cameraTransitioning || !cam.current) return;

    if (phase.current === "ORBIT") {
      cam.current.fov = THREE.MathUtils.lerp(cam.current.fov, (state.startFov + state.endFov) / 2, delta * 2);
      cam.current.updateProjectionMatrix();
    } 
    else if (phase.current === "FLY_IN") {
      state.t += delta / FLY_DUR;
      
      if (state.t >= 1.0) {
        setCameraTransitioning(false);
        phase.current = "IDLE";
        return;
      }

      const easeOutEx = (x) => 1 - Math.pow(1 - x, 6);
      const easeInOut = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      
      const easedT = easeOutEx(state.t);

      const pCam = scene.getObjectByName("PlanetCamera");
      const pObj = scene.getObjectByName(target);
      if (pCam && pObj) {
        pCam.getWorldPosition(state.endPos);
        pCam.getWorldDirection(state.dir);
        pObj.getWorldPosition(state.center);
      }

      state.curve.getPoint(easedT, cam.current.position);

      if (state.t < 0.75) {
        state.look.copy(state.center);
      } else {
        const lookT = easeInOut((state.t - 0.75) / 0.25);
        state.sight.copy(state.endPos).add(state.temp.copy(state.dir).multiplyScalar(state.orbitDist * 0.5));
        state.look.copy(state.center).lerp(state.sight, lookT);
      }

      cam.current.fov = THREE.MathUtils.lerp(
        state.startFov, 
        state.endFov, 
        state.t > 0.5 ? easeInOut((state.t - 0.5) / 0.5) : 0
      );
      cam.current.updateProjectionMatrix();
      
      cam.current.up.copy(state.startUp).lerp(state.endUp, easedT).normalize();
      cam.current.lookAt(state.look);
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cam}
        makeDefault={cameraTransitioning}
        near={0.0001}
        far={10000000}
      />
      <CameraControls 
        ref={controlsRef} 
        camera={cam.current}
        mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }}
        touches={{ one: 0, two: 0, three: 0 }}
      />
    </>
  );
}