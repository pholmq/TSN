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

  // New Refs for the Orbit Phase
  const orbitStartPos = useRef(new Vector3());
  const orbitEndPos = useRef(new Vector3()); // The "Waypoint"
  const orbitCenter = useRef(new Vector3()); // Planet Center
  const orbitRadius = useRef(0);

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

      // --- 1. CAPTURE POSITIONS ---
      const startPos = new Vector3();
      orbitCam.getWorldPosition(startPos);
      orbitStartPos.current.copy(startPos);

      const endPos = new Vector3();
      planetCam.getWorldPosition(endPos);

      const planetCenter = new Vector3();
      planetObj.getWorldPosition(planetCenter);
      orbitCenter.current.copy(planetCenter);

      // Save orientations & FOV
      orbitCam.getWorldQuaternion(startQuat.current);
      planetCam.getWorldQuaternion(endQuat.current);
      startFov.current = orbitCam.fov;

      // --- 2. CALCULATE ORBIT WAYPOINT (Phase 1 Target) ---
      const startDist = new Vector3()
        .subVectors(startPos, planetCenter)
        .length();
      orbitRadius.current = startDist;

      // Calculate direction "Above and Behind" the target
      const landQuat = new Quaternion();
      planetCam.getWorldQuaternion(landQuat);

      const forward = new Vector3(0, 0, -1).applyQuaternion(landQuat);
      const surfaceNormal = new Vector3()
        .subVectors(endPos, planetCenter)
        .normalize();

      // Mix Up (0.8) and Back (-0.5) to get the angle
      const orbitDirection = new Vector3()
        .copy(surfaceNormal)
        .multiplyScalar(0.8) // High up
        .add(forward.clone().multiplyScalar(-0.5)) // Slightly behind
        .normalize();

      // The Waypoint is at the same distance as we started (Orbital altitude)
      const waypointPos = planetCenter
        .clone()
        .add(orbitDirection.multiplyScalar(startDist));
      orbitEndPos.current.copy(waypointPos);

      // --- 3. CALCULATE BEZIER CURVE (Phase 2: Waypoint -> Surface) ---
      // We essentially reuse your existing logic, but start from `waypointPos` instead of `startPos`

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

      // The midpoint is now between the Waypoint and Approach
      const midPoint = new Vector3().lerpVectors(
        waypointPos,
        approachPoint,
        0.5
      );

      curveRef.current = new CubicBezierCurve3(
        waypointPos, // Start the dive from the waypoint
        midPoint,
        approachPoint,
        endPos
      );

      // --- 4. INITIALIZE CAMERA STATE ---
      transitionCamRef.current.position.copy(startPos);
      transitionCamRef.current.quaternion.copy(startQuat.current);
      transitionCamRef.current.fov = startFov.current;
      transitionCamRef.current.updateProjectionMatrix();

      lookAtTargetRef.current.copy(planetCenter);
      progress.current = 0;
    }
  }, [cameraTransitioning]);

  const duration = 12; // Increased duration slightly to account for the extra travel
  const orbitPhaseSplit = 0.35; // 35% of time spent orbiting, 65% diving

  const blendStartQuat = useRef(new Quaternion());

  useFrame((state, delta) => {
    if (cameraTransitioning && curveRef.current && transitionCamRef.current) {
      progress.current += delta / duration;

      if (progress.current >= 1) {
        progress.current = 1;
        setCameraTransitioning(false);
      }

      // --- PHASE 1: ORBIT (0% to 35%) ---
      if (progress.current < orbitPhaseSplit) {
        // Normalize t from 0 to 1 within this phase
        const phaseT = progress.current / orbitPhaseSplit;
        // Smooth ease in/out
        const eased =
          phaseT < 0.5 ? 2 * phaseT * phaseT : -1 + (4 - 2 * phaseT) * phaseT;

        // Spherical Interpolation (Slerp-like) for Position
        // We lerp the vectors, then re-normalize to radius to keep a perfect arc
        const currentPos = new Vector3().lerpVectors(
          orbitStartPos.current,
          orbitEndPos.current,
          eased
        );

        // Project back to sphere surface (relative to planet center)
        const relPos = new Vector3().subVectors(
          currentPos,
          orbitCenter.current
        );
        relPos.setLength(orbitRadius.current); // Maintain altitude
        transitionCamRef.current.position.copy(orbitCenter.current).add(relPos);

        // Keep looking at planet center
        transitionCamRef.current.lookAt(lookAtTargetRef.current);
      }

      // --- PHASE 2: DIVE (35% to 100%) ---
      else {
        // Normalize t from 0 to 1 within this phase
        const rawT =
          (progress.current - orbitPhaseSplit) / (1 - orbitPhaseSplit);
        const eased = 1 - Math.pow(1 - rawT, 4); // Quartic ease out for dive

        // Get point on Bezier curve
        const point = curveRef.current.getPoint(eased);
        transitionCamRef.current.position.copy(point);

        // Rotation Logic (Mostly identical to your original)
        if (rawT < 0.95) {
          // Look at planet center, but gradually blend UP vector to match landing orientation
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

          // Save quaternion near the end for the final blend
          if (rawT >= 0.94) {
            blendStartQuat.current.copy(transitionCamRef.current.quaternion);
          }
        } else {
          // Final 5%: Smooth blend to exact target rotation
          const blendProgress = (rawT - 0.95) / 0.05;
          const currentQuat = new Quaternion();

          currentQuat.slerpQuaternions(
            blendStartQuat.current,
            endQuat.current,
            blendProgress
          );
          transitionCamRef.current.quaternion.copy(currentQuat);
        }
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
