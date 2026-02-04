import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Vector3, Quaternion, CubicBezierCurve3 } from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import * as THREE from "three";

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
  const endQuat = useRef(new Quaternion());
  const startFov = useRef(15);

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

      // FORCE planet visible
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

      // Save orientations
      orbitCam.getWorldQuaternion(startQuat.current);
      planetCam.getWorldQuaternion(endQuat.current);
      startFov.current = orbitCam.fov;

      // --- DEBUG MARKER START ---
      // Create a visible marker at the calculated end position & rotation
      const markerGroup = new THREE.Group();
      markerGroup.name = "debugFinalPos";
      markerGroup.position.copy(endPos);
      markerGroup.quaternion.copy(endQuat.current);

      // 1. Visual Box (Camera Body)
      // const boxGeom = new THREE.BoxGeometry(0.1, 0.1, 0.2);
      // const boxMat = new THREE.MeshBasicMaterial({
      //   color: 0x00ffff, // Cyan
      //   wireframe: true,
      //   depthTest: false, // Always visible on top
      //   transparent: true,
      // });
      // const boxMesh = new THREE.Mesh(boxGeom, boxMat);
      // markerGroup.add(boxMesh);

      // 2. Axes Helper (Shows Orientation: R=X, G=Y, B=Z)
      // const axesHelper = new THREE.AxesHelper(10); // Long axes to see clearly
      // markerGroup.add(axesHelper);

      // scene.add(markerGroup);
      // --- DEBUG MARKER END ---

      // Calculate approach (your existing code)
      const planetCamWorldDirection = new Vector3();
      planetCam.getWorldDirection(planetCamWorldDirection);

      const approachDirection = planetCamWorldDirection.clone().negate();
      const endDist = new Vector3().subVectors(endPos, planetCenter).length();
      const approachAltitude = endDist * 2;
      const approachDistance = endDist * 4;

      const approachPoint = endPos
        .clone()
        .add(approachDirection.multiplyScalar(approachDistance));
      const heightOffset = approachAltitude - endDist;
      const planetUp = new Vector3()
        .subVectors(endPos, planetCenter)
        .normalize();
      approachPoint.add(planetUp.multiplyScalar(heightOffset));

      const midPoint = new Vector3().lerpVectors(startPos, approachPoint, 0.5);

      curveRef.current = new CubicBezierCurve3(
        startPos,
        midPoint,
        approachPoint,
        endPos
      );

      // Set initial camera state
      transitionCamRef.current.position.copy(startPos);
      transitionCamRef.current.quaternion.copy(startQuat.current);
      transitionCamRef.current.fov = startFov.current;
      transitionCamRef.current.updateProjectionMatrix();

      lookAtTargetRef.current.copy(planetCenter);
      progress.current = 0;

      // Cleanup
      return () => {
        const debugMarker = scene.getObjectByName("debugFinalPos");
        if (debugMarker) scene.remove(debugMarker);
      };
    }
  }, [cameraTransitioning]);

  const duration = 10; // seconds

  const blendStartQuat = useRef(new Quaternion());

  useFrame((state, delta) => {
    if (cameraTransitioning && curveRef.current && transitionCamRef.current) {
      progress.current += delta / duration;

      //WIP Since the animation doesent work yet we end premature
      if (progress.current >= 0.5) {
        progress.current = 1;
        setCameraTransitioning(false);
      }
      //
      if (progress.current >= 1) {
        progress.current = 1;
        setCameraTransitioning(false);
      }

      const eased = 1 - Math.pow(1 - progress.current, 8);

      // Get point on curve
      const point = curveRef.current.getPoint(eased);
      transitionCamRef.current.position.copy(point);

      if (progress.current < 0.95) {
        // First 95%: look at planet with gradually rotating UP
        const defaultUp = new Vector3(0, 1, 0);
        const planetCamUp = new Vector3(0, 1, 0).applyQuaternion(
          endQuat.current
        );

        const blendedUp = new Vector3().lerpVectors(
          defaultUp,
          planetCamUp,
          eased
        );

        transitionCamRef.current.up.copy(blendedUp);
        transitionCamRef.current.lookAt(lookAtTargetRef.current);

        // Save quaternion at 95% for smooth blend
        if (progress.current >= 0.94) {
          blendStartQuat.current.copy(transitionCamRef.current.quaternion);
        }
      } else {
        // Last 5%: gentle blend to final orientation
        const blendProgress = (progress.current - 0.95) / 0.05;
        const currentQuat = new Quaternion();

        currentQuat.slerpQuaternions(
          blendStartQuat.current,
          endQuat.current,
          blendProgress
        );
        transitionCamRef.current.quaternion.copy(currentQuat);
      }
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
