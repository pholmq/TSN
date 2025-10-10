import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Vector3, Euler } from "three";
import TWEEN from "@tweenjs/tween.js";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

export default function TransitionCamera() {
  const transitionCamRef = useRef(null);
  const animationDataRef = useRef(null);
  const lookAtTarget = useRef(new Vector3());

  const { scene, camera: activeCamera } = useThree();
  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);
  const setCameraTransitioning = useStore((s) => s.setCameraTransitioning);
  const runIntro = useStore((s) => s.runIntro);

  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);
  const planCamFov = usePlanetCameraStore((s) => s.planCamFov);

  useEffect(() => {
    if (planetCamera && !runIntro && !cameraTransitioning) {
      const planetCam = scene.getObjectByName("PlanetCamera");
      const planetTargetObj = scene.getObjectByName(planetCameraTarget);

      if (!planetCam || !planetTargetObj) return;

      const startPos = new Vector3();
      activeCamera.getWorldPosition(startPos);
      const startFov = activeCamera.fov;

      const endPos = new Vector3();
      planetCam.getWorldPosition(endPos);
      const endFov = planCamFov;

      const planetCenter = new Vector3();
      planetTargetObj.getWorldPosition(planetCenter);

      animationDataRef.current = {
        startPos,
        startFov,
        endPos,
        endFov,
        planetCenter,
      };

      setCameraTransitioning(true);
    }
  }, [planetCamera, runIntro]);

  useEffect(() => {
    if (
      cameraTransitioning &&
      transitionCamRef.current &&
      animationDataRef.current
    ) {
      const { startPos, startFov, endPos, endFov, planetCenter } =
        animationDataRef.current;

      transitionCamRef.current.position.copy(startPos);
      transitionCamRef.current.lookAt(planetCenter);
      // Apply the Math.PI rotation to match planet camera orientation
      transitionCamRef.current.rotation.y += Math.PI;
      transitionCamRef.current.fov = startFov;
      transitionCamRef.current.updateProjectionMatrix();

      lookAtTarget.current.copy(planetCenter);

      new TWEEN.Tween(transitionCamRef.current.position)
        .to({ x: endPos.x, y: endPos.y, z: endPos.z }, 8000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();

      const fovObj = { value: startFov };
      new TWEEN.Tween(fovObj)
        .to({ value: endFov }, 8000)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          transitionCamRef.current.fov = fovObj.value;
          transitionCamRef.current.updateProjectionMatrix();
        })
        .onComplete(() => {
          setCameraTransitioning(false);
          animationDataRef.current = null;
        })
        .start();
    }
  }, [cameraTransitioning]);

  useFrame(() => {
    if (cameraTransitioning) {
      TWEEN.update();
      transitionCamRef.current.lookAt(lookAtTarget.current);
      // Keep the Math.PI rotation during lookAt
      transitionCamRef.current.rotation.y += Math.PI;
    }
  });

  if (!cameraTransitioning) return null;

  return (
    <PerspectiveCamera
      ref={transitionCamRef}
      makeDefault={true}
      near={0.0001}
      far={10000000000000}
      rotation={[0, Math.PI, 0]} // Match planet camera's base rotation
    />
  );
}
