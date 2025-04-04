import { useEffect, useLayoutEffect, useRef } from "react";
import { CameraHelper, Vector3 } from "three";

import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";

import { useGesture } from "@use-gesture/react";

import useKeyPress from "../../utils/useKeyPress";
import { useStore } from "../../store";
import Ballrod from "../../utils/Ballrod";

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

// import PlanCamLookAt from "../utils/PlanCamLookAt";
import Ground from "../../utils/Ground";
export default function PlanetCamera() {
  const posRef = useStore((s) => s.posRef);

  const planetCamRef = useRef(null);
  const planetCamSystemRef = useRef(null);
  const camBoxRef = useRef(null);
  const longAxisRef = useRef(null);
  const latAxisRef = useRef(null);
  const camMountRef = useRef(null);
  const keyPressed = useKeyPress();
  const targetObjRef = useRef(null);

  const { scene, camera, gl } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  // const cameraTarget = useStore((s) => s.cameraTarget);
  const planetCameraTarget = useStore((s) => s.planetCameraTarget);
  const planetData = useStore((s) => s.planetCameraTargetData);
  const cameraHeight = 0.0043;

  let planetCameraLookAt = new Vector3();

  useLayoutEffect(() => {
    loadCameraPosition();
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    targetObjRef.current.add(planetCamSystemRef.current);
    planetCamRef.current.updateProjectionMatrix();
    useStore.setState({
      planetCameraTargetData: targetObjRef.current.userData,
    });
  }, [planetCameraTarget]);

  function loadCameraPosition() {
    const planetCameraDirection = useStore.getState().planetCameraDirection;
    planetCamRef.current.rotation.y =
      planetCameraDirection.camRotationy + Math.PI;
    planetCamRef.current.rotation.x = planetCameraDirection.camRotationx;
    planetCamRef.current.fov = planetCameraDirection.camFov;
    latAxisRef.current.rotation.x =
      planetCameraDirection.latRotationx - Math.PI / 2;
    longAxisRef.current.rotation.y =
      planetCameraDirection.longRotationy - Math.PI / 2;
  }

  function saveCameraPosition() {
    useStore.setState((s) => ({
      planetCameraDirection: {
        camRotationy: planetCamRef.current.rotation.y - Math.PI,
        camRotationx: planetCamRef.current.rotation.x,
        camFov: planetCamRef.current.fov,
        latRotationx: latAxisRef.current.rotation.x + Math.PI / 2,
        longRotationy: longAxisRef.current.rotation.y + Math.PI / 2,
        height: camMountRef.current.position.y,
      },
    }));
  }

  useHelper(
    //Only show helper if planetCamera is not active
    planetCameraHelper && !planetCamera ? planetCamRef : false,
    CameraHelper
  );

  // //Set touch action to none so useGesture doesn't complain
  gl.domElement.style.touchAction = "none";
  useGesture(
    {
      onDrag: planetCamera //If planetCamera is true, then we hand it a function
        ? ({ delta: [dx, dy] }) => {
            //Multiplute by fov to make the movement less sensitive when we're zoomed in
            const sensitivity = 0.0001 * planetCamRef.current.fov;
            planetCamRef.current.rotation.y += dx * sensitivity;
            let camRotationX =
              planetCamRef.current.rotation.x + dy * sensitivity;
            if (camRotationX > Math.PI / 2) camRotationX = Math.PI / 2;
            if (camRotationX < -Math.PI / 2) camRotationX = -Math.PI / 2;
            planetCamRef.current.rotation.x = camRotationX;
            camBoxRef.current.rotation.y = planetCamRef.current.rotation.y;
            camBoxRef.current.rotation.x = planetCamRef.current.rotation.x;

            saveCameraPosition();
          }
        : () => {}, // and if not, it gets and empty function

      onWheel: planetCamera
        ? ({ delta: [, dy] }) => {
            //
            const sensitivity = 0.01;
            const fov = planetCamRef.current.fov + dy * sensitivity;

            if (fov > 0 && fov < 120) {
              planetCamRef.current.fov = fov;
              planetCamRef.current.updateProjectionMatrix();
            }
            saveCameraPosition();
          }
        : () => {},
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
    }
  );

  let latRotationX;
  let camRotationX;
  useFrame(() => {
    if (keyPressed) {
      latRotationX = latAxisRef.current.rotation.x;
    }

    switch (keyPressed) {
      case "w":
        latRotationX += 0.005;
        break;
      case "s":
        latRotationX -= 0.005;
        break;
      case "a":
        longAxisRef.current.rotation.y -= 0.005;
        break;
      case "d":
        longAxisRef.current.rotation.y += 0.005;
        break;
      case "q":
        camMountRef.current.position.y += 0.1;
        break;
      case "e":
        if (camMountRef.current.position.y >= 0) {
          q;
          camMountRef.current.position.y -= 0.1;
        }
        if (camMountRef.current.position.y < 0) {
          camMountRef.current.position.y = 0;
        }

        break;
    }

    if (keyPressed === "PageUp") {
      if (planetCamRef.current.fov > 0.5) {
        planetCamRef.current.fov -= 0.5;
        planetCamRef.current.updateProjectionMatrix();
      }
    }
    if (keyPressed === "PageDown") {
      if (planetCamRef.current.fov < 120) {
        planetCamRef.current.fov += 0.5;
        planetCamRef.current.updateProjectionMatrix();
      }
    }

    if (keyPressed) {
      if (latRotationX > 0) latRotationX = 0;
      if (latRotationX < -Math.PI) latRotationX = -Math.PI;

      latAxisRef.current.rotation.x = latRotationX;

      // console.log(
      //   "longAxisRef.current.rotation.y: " +
      //     longAxisRef.current.rotation.y +
      //     "longToRad(radToLong(x)): " +
      //     longToRad(radToLong(longAxisRef.current.rotation.y))

      // );

      saveCameraPosition();
    }
  });

  const planCamLat = useStore((s) => s.planCamLat);
  const planCamLong = useStore((s) => s.planCamLong);
  const planCamHeight = useStore((s) => s.planCamHeight);
  const planCamAngle = useStore((s) => s.planCamAngle);
  const planCamDirection = useStore((s) => s.planCamDirection);
  const planCamFov = useStore((s) => s.planCamFov);
  const planCamFar = useStore((s) => s.planCamFar);

  const mountHeight = planCamHeight / 1495978.707;

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
            {/* <Ground planet={planetCameraTarget} position={[0, -0.2, 0]} /> */}
            <group ref={camMountRef} position={[0, 0, 0]}>
              <group
                name="CamBox"
                ref={camBoxRef}
                rotation={[0, 0, 0]}
                rotation-order={"YXZ"}
                // show the box if planetcamera is not active and show camera pos is on
              >
                {/* <mesh visible={!planetCamera && planetCameraHelper}>
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                  <meshStandardMaterial color="red" />
                </mesh> */}
                {/* <Ballrod
                  visible={!planetCamera && planetCameraHelper}
                  size={0.2}
                  length={0.5}
                /> */}
                {/* <PlanCamLookAt position={[0, 0, -100000]} size={10} /> */}
              </group>
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
