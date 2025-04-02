import { useEffect, useLayoutEffect, useRef } from "react";
import { Vector3 } from "three";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, useHelper } from "@react-three/drei";
import { useStore } from "../../store";
import { CameraHelper } from "three";

export default function PlanetCamera() {
  const posRef = useStore((s) => s.posRef);
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
  const planetCameraDirection = useStore((s) => s.planetCameraDirection);

  let planetCameraLookAt = new Vector3();

  useLayoutEffect(() => {
    targetObjRef.current = scene.getObjectByName(planetCameraTarget);
    targetObjRef.current.add(planetCamSystemRef.current);
    if (planetCamRef.current) {
      planetCamRef.current.updateProjectionMatrix();
    }
    useStore.setState({
      planetCameraTargetData: targetObjRef.current.userData,
    });
  }, [planetCameraTarget]);

  useEffect(() => {
    if (!planetCamRef.current) return;

    planetCamRef.current.rotation.y =
      planetCameraDirection.camRotationy + Math.PI;
    planetCamRef.current.rotation.x = planetCameraDirection.camRotationx;
    planetCamRef.current.fov = planetCameraDirection.camFov;
    planetCamRef.current.updateProjectionMatrix();

    latAxisRef.current.rotation.x =
      planetCameraDirection.latRotationx - Math.PI / 2;
    longAxisRef.current.rotation.y =
      planetCameraDirection.longRotationy - Math.PI / 2;
    camMountRef.current.position.y = planetCameraDirection.height;

    camBoxRef.current.rotation.y = planetCamRef.current.rotation.y;
    camBoxRef.current.rotation.x = planetCamRef.current.rotation.x;
  }, [planetCameraDirection]);

  useHelper(
    planetCameraHelper && !planetCamera ? planetCamRef : false,
    CameraHelper
  );

  return (
    <>
      <group ref={planetCamSystemRef} rotation={[0, 0, 0]}>
        <group ref={longAxisRef}>
          <group ref={latAxisRef}>
            <group
              ref={camMountRef}
              position={[0, planetCameraDirection.height, 0]}
            >
              <group
                name="CamBox"
                ref={camBoxRef}
                rotation={[0, 0, 0]}
                rotation-order={"YXZ"}
              >
                {/* Optional: Add Ballrod or other helpers here */}
              </group>
              <group>
                <PerspectiveCamera
                  name="PlanetCamera"
                  rotation={[0, Math.PI, 0]}
                  near={0.00007}
                  far={1000000000000}
                  makeDefault={planetCamera}
                  ref={planetCamRef}
                  rotation-order={"YXZ"}
                />
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
