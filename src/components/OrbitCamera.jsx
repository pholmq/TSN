import { useRef, useLayoutEffect, useEffect, useMemo, useState } from "react";
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
  const setCameraControlsRef = useStore((s) => s.setCameraControlsRef);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);
  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes);

  const targetObjRef = useRef(null);
  const target = useMemo(() => new Vector3(), []);

  // --- TOUCH DETECTION ---
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hasTouchEvents = "ontouchstart" in window;

    if (isCoarsePointer || hasTouchEvents) {
      setIsTouchDevice(true);
    }
  }, []);

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
  }, [setRunIntro]);

  useLayoutEffect(() => {
    targetObjRef.current = scene.getObjectByName(cameraTarget);
    if (targetObjRef.current) {
      targetObjRef.current.getWorldPosition(target);
      controlsRef.current.setTarget(target.x, target.y, target.z, true);
    }
  }, [cameraTarget, cameraUpdate, camera, scene, target]);

  useEffect(() => {
    if (controlsRef.current && !runIntro) {
      controlsRef.current.setPosition(0, 2200, 0, true);
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
  }, [planetCamera, scene]);

  useFrame(() => {
    if (cameraFollow) {
      if (targetObjRef.current) {
        targetObjRef.current.updateWorldMatrix(true, false);
        targetObjRef.current.getWorldPosition(target);
        controlsRef.current.setTarget(target.x, target.y, target.z, false);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault={runIntro || (!planetCamera && !cameraTransitioning)}
        name="OrbitCamera"
        ref={cameraRef}
        position={[-30000000, 10000000, 0]}
        fov={15}
        near={0.01}
        far={10000000000000}
      />
      <CameraControls
        ref={controlsRef}
        camera={cameraRef.current}
        enabled={!planetCamera}
        smoothTime={0.4}
        draggingSmoothTime={0.125}
        minDistance={actualPlanetSizes ? 0.01 : 5}
        // Conditional pan disabling: 0 on mobile, 2.0 (default) on desktop
        truckSpeed={isTouchDevice ? 0 : 2.0}
      />
      {runIntro && <CameraAnimation controlsRef={controlsRef} />}
    </>
  );
}
