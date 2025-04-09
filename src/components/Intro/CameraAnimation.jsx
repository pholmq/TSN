import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { useStore } from "../../store";
import * as THREE from "three";
import FloatingText from "./FloatingText";

export default function CameraAnimation({ controlsRef }) {
  const { camera, gl } = useThree();
  const tweenRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showText, setShowText] = useState(true);
  const cameraPosition = useRef(new THREE.Vector3());

  const startPos = { x: -30000000, y: 10000000, z: 0 };
  const endPos = { x: 0, y: 2200, z: 0 };
  const duration = 8000;

  const initializeAnimation = (controls) => {
    controls.setPosition(startPos.x, startPos.y, startPos.z, false);

    const coords = { ...startPos };
    tweenRef.current = new TWEEN.Tween(coords)
      .to(endPos, duration)
      .easing(TWEEN.Easing.Quintic.Out)
      .onUpdate(() => {
        controls.setPosition(coords.x, coords.y, coords.z, false);
        cameraPosition.current.set(coords.x, coords.y, coords.z);
      })
      .onComplete(() => {
        tweenRef.current = null;
        setShowText(false);
      })
      .start();

    const handleClick = (event) => {
      if (
        event.button === 0 &&
        tweenRef.current &&
        tweenRef.current.isPlaying()
      ) {
        stopAnimation();
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);

    return () => {
      if (tweenRef.current) tweenRef.current.stop();
      canvas.removeEventListener("click", handleClick);
    };
  };

  function stopAnimation() {
    const controls = controlsRef.current;
    tweenRef.current?.stop();
    controls.setPosition(endPos.x, endPos.y, endPos.z, false);
    tweenRef.current = null;
    setShowText(false);
  }

  const resetClicked = useStore((s) => s.resetClicked);
  useEffect(() => {
    if (tweenRef.current && tweenRef.current.isPlaying()) stopAnimation();
  }, [resetClicked]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls && !isInitialized) {
      const cleanup = initializeAnimation(controls);
      setIsInitialized(true);
      return cleanup;
    }
    TWEEN.update();
  });

  return null;
  // showText ? (
  //   <FloatingText cameraPosition={cameraPosition.current} />
  // ) : null;
}
