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
    endFov: 50
  });

  const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

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
    
    // Ensure we have the camera, its mount parent, and the target planet
    if (!oCam || !pCam || !pCam.parent || !pObj) return;

    // Force visibility
    if (pObj.material) {
      pObj.material.transparent = true;
      pObj.material.opacity = 1.0;
      pObj.material.needsUpdate = true;
    }

    [oCam, pCam, pCam.parent, pObj].forEach((obj) => obj.updateMatrixWorld(true));

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

    // --- BULLETPROOF RUNWAY CALCULATION ---
    const mountPos = new THREE.Vector3();
    pCam.parent.getWorldPosition(mountPos);

    // 1. Extract pure Yaw (Ignore Pitch completely)
    const yaw = pCam.rotation.y;

    // 2. Build local backward vector (X=sin, Z=cos)
    const localBackward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();

    // 3. Convert to world space using the perfectly leveled camera mount
    const worldBackward = localBackward.transformDirection(pCam.parent.matrixWorld).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0).transformDirection(pCam.parent.matrixWorld).normalize();

    const altitude = mountPos.distanceTo(planetPos);
    
    // 4. Calculate runway target position (Intersecting the infinite line behind the camera)
    const runwayPos = mountPos.clone()
        .add(worldBackward.multiplyScalar(altitude * 1.5)) // Start fly-in 1.5x altitude back
        .add(worldUp.multiplyScalar(altitude * 0.2));      // Slightly above the horizon

    // --- PHASE 1: DREI CAMERA CONTROLS ORBIT ---
    phase.current = "ORBIT";
    controlsRef.current.enabled = true;
    controlsRef.current.smoothTime = 0.8; // Duration of the orbit Phase
    
    // Instantly snap controls to OrbitCamera's position, looking at the planet
    controlsRef.current.setLookAt(
        startPos.x, startPos.y, startPos.z,
        planetPos.x, planetPos.y, planetPos.z,
        false
    );

    // Smoothly orbit to the runway position, still looking at the planet
    controlsRef.current.setLookAt(
        runwayPos.x, runwayPos.y, runwayPos.z,
        planetPos.x, planetPos.y, planetPos.z,
        true
    ).then(() => {
        // Promise resolves when CameraControls finishes the orbit maneuver
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
        // CameraControls handles Pos/Rot. We loosely lerp the FOV towards a middle point.
        cam.current.fov = THREE.MathUtils.lerp(cam.current.fov, (flyState.current.startFov + flyState.current.endFov) / 2, delta * 2);
        cam.current.updateProjectionMatrix();
    } 
    else if (phase.current === "FLY_IN") {
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
        cam.current.position.lerpVectors(flyState.current.startPos, flyState.current.endPos, t);
        cam.current.quaternion.slerpQuaternions(flyState.current.startQuat, flyState.current.endQuat, t);
        
        // Finalize FOV
        cam.current.fov = THREE.MathUtils.lerp(cam.current.fov, flyState.current.endFov, t);
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
      <CameraControls 
        ref={controlsRef} 
        camera={cam.current}
        mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }}
        touches={{ one: 0, two: 0, three: 0 }}
      />
    </>
  );
}