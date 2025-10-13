import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Vector3, Quaternion, CubicBezierCurve3 } from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

export default function TransitionCamera() {
  const transitionCamRef = useRef(null);
  const curveRef = useRef(null);
  const lookAtTargetRef = useRef(new Vector3());
  const progress = useRef(0);

  const { scene } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);
  const setCameraTransitioning = useStore((s) => s.setCameraTransitioning);

  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  const startQuat = useRef(new Quaternion());
  const startFov = useRef(15);
  const duration = 8; // seconds

  useEffect(() => {
    if (planetCamera) {
      setCameraTransitioning(true);
    }
  }, [planetCamera]);

  useEffect(() => {
    const handleClick = (event) => {
      if (event.button === 0 && cameraTransitioning) {
        // Left click - stop transition immediately
        setCameraTransitioning(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [cameraTransitioning]);

  useEffect(() => {
    if (cameraTransitioning && transitionCamRef.current) {
      const orbitCam = scene.getObjectByName("OrbitCamera");
      const planetCam = scene.getObjectByName("PlanetCamera");
      const planetObj = scene.getObjectByName(planetCameraTarget);

      if (!orbitCam || !planetCam || !planetObj) return;

      // FORCE planet visible - reset any previous opacity changes
      if (planetObj.material) {
        planetObj.material.transparent = true;
        planetObj.material.opacity = 1;
        planetObj.material.needsUpdate = true;
      }

      // Get positions
      const startPos = new Vector3();
      orbitCam.getWorldPosition(startPos);

      const endPos = new Vector3();
      planetCam.getWorldPosition(endPos);

      const planetCenter = new Vector3();
      planetObj.getWorldPosition(planetCenter);

      // Save orientation and FOV
      orbitCam.getWorldQuaternion(startQuat.current);
      startFov.current = orbitCam.fov;

      // Calculate bezier curve that arcs around the planet
      // Control points are positioned to create an arc around planet center
      const toStart = new Vector3().subVectors(startPos, planetCenter);
      const toEnd = new Vector3().subVectors(endPos, planetCenter);

      // Create control points that maintain altitude above planet
      const startDist = toStart.length();
      const endDist = toEnd.length();
      const avgDist = (startDist + endDist) / 2;

      // First control point: 1/3 of the way, maintaining altitude
      const control1Dir = new Vector3()
        .lerpVectors(toStart, toEnd, 0.33)
        .normalize();
      const control1 = control1Dir
        .multiplyScalar(Math.max(startDist, avgDist * 1.2))
        .add(planetCenter);

      // Second control point: 2/3 of the way, maintaining altitude
      const control2Dir = new Vector3()
        .lerpVectors(toStart, toEnd, 0.67)
        .normalize();
      const control2 = control2Dir
        .multiplyScalar(Math.max(endDist, avgDist * 1.2))
        .add(planetCenter);

      // Create bezier curve
      curveRef.current = new CubicBezierCurve3(
        startPos,
        control1,
        control2,
        endPos
      );

      // Set initial camera state
      transitionCamRef.current.position.copy(startPos);
      transitionCamRef.current.quaternion.copy(startQuat.current);
      transitionCamRef.current.fov = startFov.current;
      transitionCamRef.current.updateProjectionMatrix();

      lookAtTargetRef.current.copy(planetCenter);
      progress.current = 0;
    }
  }, [cameraTransitioning]);

  useFrame((state, delta) => {
    if (cameraTransitioning && curveRef.current && transitionCamRef.current) {
      progress.current += delta / duration;

      if (progress.current >= 1) {
        progress.current = 1;
        setCameraTransitioning(false);
      }

      // Easing function (cubic out)
      const eased = 1 - Math.pow(1 - progress.current, 3);

      // Get point on curve
      const point = curveRef.current.getPoint(eased);
      transitionCamRef.current.position.copy(point);

      // Keep looking at planet center during approach
      transitionCamRef.current.lookAt(lookAtTargetRef.current);
    }
  });

  if (!cameraTransitioning) return null;

  return (
    <PerspectiveCamera
      ref={transitionCamRef}
      makeDefault={true}
      near={0.0001}
      far={10000000000000}
    />
  );
}
