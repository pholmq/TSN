import { useEffect, useLayoutEffect, useRef } from "react";
import { CameraHelper, Vector3 } from "three";

import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { useStore } from "../../store";

function latToRad(degrees) {
  // Shift the input by -90 degrees and scale to match the desired output
  // Normal conversion is (degrees * Math.PI / 180)
  // We want: 90° → 0, 0° → -π/2, -90° → -π
  return (degrees - 90) * (Math.PI / 180);
}

function radToLat(radians) {
  // Reverse the previous conversion
  // Normal conversion is (radians * 180 / Math.PI)
  // We want: 0 → 90°, -π/2 → 0°, -π → -90°
  return radians * (180 / Math.PI) + 90;
}

function longToRad(degrees) {
  // Normalize the angle to be within -180 to 180 degrees
  let normalized = ((((degrees + 180) % 360) + 360) % 360) - 180;
  // Convert to standard radians where 0° = 0rad, 90° = π/2, etc.
  let standardRadians = normalized * (Math.PI / 180);
  // Shift the result by adding 3π/2 and normalize to 0 to 2π range
  let shiftedRadians = (standardRadians + (3 * Math.PI) / 2) % (2 * Math.PI);
  return shiftedRadians;
}

function radToLong(radians) {
  // Normalize radians to 0 to 2π
  let normalizedRad = ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // Reverse the shift by subtracting 3π/2 and normalize again
  let unshiftedRad =
    (normalizedRad - (3 * Math.PI) / 2 + 2 * Math.PI) % (2 * Math.PI);
  // Convert to degrees and adjust to -180 to 180 range
  let degrees = unshiftedRad * (180 / Math.PI);
  if (degrees > 180) {
    degrees -= 360;
  }
  return degrees;
}

function kmToUnits(kilometers) {
  const units = kilometers / 1495978.707;
  //Kilometers is divided by this since 100 units in the model is 1 AU
  return units;
}

function lyToUnits(lightYears) {
  return lightYears * 6324100;
}

function altToRad(degrees) {
  return degrees * (Math.PI / 180);
}

function dirToRad(degrees) {
  return Math.PI - (Math.PI / 180) * degrees;
}

export default function PlanetCamera() {
  const planetCamRef = useRef(null);
  const planetCamSystemRef = useRef(null);
  const camBoxRef = useRef(null);
  const longAxisRef = useRef(null);
  const latAxisRef = useRef(null);
  const camMountRef = useRef(null);
  const targetObjRef = useRef(null);

  const { scene } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  const planetCameraTarget = useStore((s) => s.planetCameraTarget);

  useLayoutEffect(() => {
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    targetObjRef.current.add(planetCamSystemRef.current);
    planetCamRef.current.updateProjectionMatrix();
  }, [planetCameraTarget]);

  useHelper(
    //Only show helper if planetCamera is not active
    planetCameraHelper && !planetCamera ? planetCamRef : false,
    CameraHelper
  );

  const planCamLat = useStore((s) => s.planCamLat);
  const planCamLong = useStore((s) => s.planCamLong);
  const planCamHeight = useStore((s) => s.planCamHeight);
  const planCamAngle = useStore((s) => s.planCamAngle);
  const planCamDirection = useStore((s) => s.planCamDirection);
  const planCamFov = useStore((s) => s.planCamFov);
  const planCamFar = useStore((s) => s.planCamFar);

  useEffect(() => {
    if (!latAxisRef.current) return;
    latAxisRef.current.rotation.x = latToRad(planCamLat);
    longAxisRef.current.rotation.y = longToRad(planCamLong);
    camMountRef.current.position.y = kmToUnits(planCamHeight);
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
  ]);

  return (
    <>
      <group ref={planetCamSystemRef} rotation={[0, 0, 0]}>
        {/* We put the camera system in a group and rotate it so that lat and long are at 0 */}
        <group ref={longAxisRef}>
          <group ref={latAxisRef}>
            <group ref={camMountRef} position={[0, 0, 0]}>
              <group>
                <PerspectiveCamera
                  name="PlanetCamera"
                  rotation={[0, Math.PI, 0]}
                  near={0.00007}
                  // far={1000000000000}
                  makeDefault={planetCamera}
                  ref={planetCamRef}
                  rotation-order={"YXZ"}
                ></PerspectiveCamera>
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
