import { useRef, useLayoutEffect, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { PerspectiveCamera, CameraControls } from "@react-three/drei";
import { useStore, useSettingsStore } from "../store";
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
  const setRunIntro = useStore((s) => s.setRunIntro);

  const targetObjRef = useRef(null);

  // Isolate vector memory outside renders
  const target = useMemo(() => new Vector3(), []);
  const currentTarget = useMemo(() => new Vector3(), []);

  const setCameraControlsRef = useStore((s) => s.setCameraControlsRef);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);

  useEffect(() => {
    if (controlsRef.current) {
      setCameraControlsRef(controlsRef);
    }
  }, [controlsRef.current, setCameraControlsRef]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (event.button === 0) {
        setRunIntro(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("wheel", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("wheel", handleMouseDown);
    };
  }, []);

  useLayoutEffect(() => {
    targetObjRef.current = scene.getObjectByName(cameraTarget);
    if (targetObjRef.current && controlsRef.current) {
      targetObjRef.current.getWorldPosition(target);

      // Allow CameraControls to handle the transition smoothly if not manually strictly following
      if (!cameraFollow) {
        controlsRef.current.setTarget(target.x, target.y, target.z, true);
      }
    }
  }, [cameraTarget, cameraUpdate, scene, cameraFollow, target]);

  useEffect(() => {
    if (controlsRef.current && !runIntro) {
      controlsRef.current.setPosition(0, 2200, 0);
    }
  }, [resetClicked, runIntro]);

  useEffect(() => {
    if (!planetCamera) {
      const { settings } = useSettingsStore.getState();
      settings.forEach((setting) => {
        if (setting.planetCamera === true) {
          const planetObj = scene.getObjectByName(setting.name);
          if (planetObj && planetObj.material) {
            planetObj.material.opacity = 1;
            planetObj.material.needsUpdate = true;
          }
        }
      });
    }
  }, [planetCamera]);

  useFrame((state, delta) => {
    if (cameraFollow && targetObjRef.current && controlsRef.current) {
      targetObjRef.current.getWorldPosition(target);
      controlsRef.current.getTarget(currentTarget);

      // Provides frame-independent smooth interpolation to the moving/new target
      currentTarget.lerp(target, 1 - Math.exp(-8 * delta));

      controlsRef.current.setTarget(
        currentTarget.x,
        currentTarget.y,
        currentTarget.z,
        false
      );
    }
  }, 100);

  return (
    <>
      <PerspectiveCamera
        makeDefault={runIntro || (!planetCamera && !cameraTransitioning)}
        name="OrbitCamera"
        ref={cameraRef}
        position={[-30000000, 10000000, 0]}
        fov={15}
        near={0.0001}
        far={10000000000000}
      />
      <CameraControls
        ref={controlsRef}
        camera={cameraRef.current}
        enabled={!planetCamera}
        minDistance={5} // Restricts maximum zoom into the current target
      />
      {runIntro && <CameraAnimation controlsRef={controlsRef} />}
    </>
  );
}
