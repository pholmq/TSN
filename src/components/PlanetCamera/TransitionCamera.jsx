import { useRef, useEffect, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

export default function TransitionCamera() {
  const { scene } = useThree();
  const cam = useRef(null);
  const controlsRef = useRef(null);

  const planetCamera = useStore((s) => s.planetCamera);
  const { cameraTransitioning, setCameraTransitioning } = useStore();
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);

  const phase = useRef("IDLE");
  const flyState = useRef({
    t: 0,
    startPos: new THREE.Vector3(),
    startQuat: new THREE.Quaternion(),
    endPos: new THREE.Vector3(),
    endQuat: new THREE.Quaternion(),
    startFov: 50,
    endFov: 50,
  });

  const easeInOutCubic = (x) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  useEffect(() => {
    const skip = (e) => {
      if (e.button === 0 && cameraTransitioning) {
        if (controlsRef.current) controlsRef.current.rest();
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

    // Force visibility
    if (pObj.material) {
      pObj.material.transparent = true;
      pObj.material.opacity = 1.0;
      pObj.material.needsUpdate = true;
    }

    [oCam, pCam, pObj].forEach((obj) => obj.updateMatrixWorld(true));

    // Get initial OrbitCamera state
    const startPos = new THREE.Vector3();
    oCam.getWorldPosition(startPos);
    flyState.current.startFov = oCam.fov;
    flyState.current.endFov = pCam.fov;

    cam.current.fov = oCam.fov;
    cam.current.updateProjectionMatrix();

    // Get target planet center
    const planetPos = new THREE.Vector3();
    pObj.getWorldPosition(planetPos);

    // --- CALCULATE RUNWAY (Behind and Above 0-degree Pitch) ---
    const pCamPos = new THREE.Vector3();
    pCam.getWorldPosition(pCamPos);

    // Temporarily level the PlanetCamera to 0 pitch to get the flat horizon vector
    const origX = pCam.rotation.x;
    pCam.rotation.x = 0;
    pCam.updateMatrixWorld(true);

    const flatDir = new THREE.Vector3();
    pCam.getWorldDirection(flatDir);

    // Get the local "Up" vector relative to the camera's current leveled yaw
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(pCam.quaternion);

    pCam.rotation.x = origX; // Restore original user pitch immediately
    pCam.updateMatrixWorld(true);

    const altitude = pCamPos.distanceTo(planetPos);

    // Set runway 1.5x altitude behind the camera, and 0.2x altitude above it
    const runwayPos = pCamPos
      .clone()
      .add(flatDir.clone().multiplyScalar(-altitude * 1.5))
      .add(upDir.clone().multiplyScalar(altitude * 0.2));

    // --- PHASE 1: DREI CAMERA CONTROLS ORBIT ---
    phase.current = "ORBIT";
    controlsRef.current.enabled = true;
    controlsRef.current.smoothTime = 0.8; // Duration of the orbit Phase

    // Instantly snap controls to OrbitCamera's position, looking at the planet
    controlsRef.current.setLookAt(
      startPos.x,
      startPos.y,
      startPos.z,
      planetPos.x,
      planetPos.y,
      planetPos.z,
      false
    );

    // Smoothly orbit to the runway position, still looking at the planet
    controlsRef.current
      .setLookAt(
        runwayPos.x,
        runwayPos.y,
        runwayPos.z,
        planetPos.x,
        planetPos.y,
        planetPos.z,
        true
      )
      .then(() => {
        // Promise resolves when CameraControls finishes the maneuver
        if (phase.current === "ORBIT") {
          phase.current = "FLY_IN";

          // Release the camera from controls
          controlsRef.current.enabled = false;

          // Setup Math fly-in targets
          flyState.current.t = 0;
          cam.current.getWorldPosition(flyState.current.startPos);
          cam.current.getWorldQuaternion(flyState.current.startQuat);

          pCam.getWorldPosition(flyState.current.endPos);
          pCam.getWorldQuaternion(flyState.current.endQuat);
        }
      });
  }, [cameraTransitioning, scene, target]);

  useFrame((_, delta) => {
    if (!cameraTransitioning || !cam.current) return;

    if (phase.current === "ORBIT") {
      // CameraControls handles Pos/Rot. We just loosely lerp the FOV towards a middle point.
      cam.current.fov = THREE.MathUtils.lerp(
        cam.current.fov,
        (flyState.current.startFov + flyState.current.endFov) / 2,
        delta * 2
      );
      cam.current.updateProjectionMatrix();
    } else if (phase.current === "FLY_IN") {
      // --- PHASE 2: MATH FLY-IN ---
      const FLY_DUR = 2.0; // Seconds to adjust pitch and slide into final mount position
      flyState.current.t += delta / FLY_DUR;

      if (flyState.current.t >= 1.0) {
        setCameraTransitioning(false);
        phase.current = "IDLE";
        return;
      }

      const t = easeInOutCubic(flyState.current.t);

      // Slide into final position and seamlessly apply user's saved pitch/yaw
      cam.current.position.lerpVectors(
        flyState.current.startPos,
        flyState.current.endPos,
        t
      );
      cam.current.quaternion.slerpQuaternions(
        flyState.current.startQuat,
        flyState.current.endQuat,
        t
      );

      // Finalize FOV
      cam.current.fov = THREE.MathUtils.lerp(
        cam.current.fov,
        flyState.current.endFov,
        t
      );
      cam.current.updateProjectionMatrix();
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
      {/* We render CameraControls but disable manual user input 
        so they can't accidentally drag it while it's transitioning 
      */}
      <CameraControls
        ref={controlsRef}
        camera={cam.current}
        mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }}
        touches={{ one: 0, two: 0, three: 0 }}
      />
    </>
  );
}
