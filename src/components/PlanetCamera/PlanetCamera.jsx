import { useEffect, useLayoutEffect, useRef } from "react";
import { CameraHelper, Vector3 } from "three";

import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { useStore } from "../../store";
import {
  latToRad,
  longToRad,
  kmToUnits,
  lyToUnits,
  altToRad,
  dirToRad,
} from "../../utils/celestial-functions";

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
