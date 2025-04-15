import { useRef, useLayoutEffect, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { PerspectiveCamera, CameraControls } from "@react-three/drei";
import { useStore } from "../store";
import CameraAnimation from "./Intro/CameraAnimation";

export default function OrbitCamera() {
  const { scene, camera } = useThree();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTarget = useStore((s) => s.cameraTarget);
  const cameraFollow = useStore((s) => s.cameraFollow);
  const cameraUpdate = useStore((s) => s.cameraUpdate);
  const resetClicked = useStore((s) => s.resetClicked);
  const runIntro = useStore((s) => s.runIntro);

  const targetObjRef = useRef(null);
  const target = new Vector3();

  useLayoutEffect(() => {
    targetObjRef.current = scene.getObjectByName(cameraTarget);
    targetObjRef.current.getWorldPosition(target);
    controlsRef.current.setTarget(target.x, target.y, target.z, false);
  }, [cameraTarget, cameraUpdate, camera]);

  useEffect(() => {
    if (controlsRef.current && !runIntro) {
      controlsRef.current.setPosition(0, 2200, 0);
    }
  }, [resetClicked, runIntro]);

  // useEffect(() => {
  //   if (controlsRef.current) {
  //     controlsRef.current.setPosition(0, 2200, 0);
  //   }
  // }, [runIntro]);

  useFrame(() => {
    if (cameraFollow) {
      targetObjRef.current.getWorldPosition(target);
      controlsRef.current.setTarget(target.x, target.y, target.z, false);
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault={!planetCamera}
        name="OrbitCamera"
        ref={cameraRef}
        
        position={[-30000000, 10000000, 0]}
        // position={[0, 2200, 0]}
        // position={[-3000, 1000, 0]}
        fov={15}
        near={0.0001}
        far={10000000000000}
      />
      <CameraControls ref={controlsRef} camera={cameraRef.current} />
      {runIntro && <CameraAnimation controlsRef={controlsRef} />}
    </>
  );
}
