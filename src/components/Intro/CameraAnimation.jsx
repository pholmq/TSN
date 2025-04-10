import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";
import { useStore } from "../../store";

export default function CameraAnimation({ controlsRef }) {
  const controls = controlsRef.current;
  const tweenRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const runIntro = useStore((s) => s.runIntro);

  const startPos = { x: -30000000, y: 10000000, z: 0 };
  const endPos = { x: 0, y: 2200, z: 0 };
  const duration = 8000;

  useEffect(() => {
    if (isInitialized) {
      const coords = { ...startPos };
      controls.setPosition(startPos.x, startPos.y, startPos.z, false);
      tweenRef.current = new TWEEN.Tween(coords)
        .to(endPos, duration)
        .easing(TWEEN.Easing.Quintic.Out)
        .onUpdate(() => {
          controls.setPosition(coords.x, coords.y, coords.z, false);
        })
        .onComplete(() => {
          tweenRef.current = null;
        })
        .start();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!runIntro) {
      if (controls) controls.setPosition(endPos.x, endPos.y, endPos.z, false);
    }
  }, [runIntro]);

  useFrame(() => {
    if (controls && !isInitialized) {
      setIsInitialized(true);
      return;
    }
    if (runIntro) {
      TWEEN.update();
    }
  });

  return null;
}
