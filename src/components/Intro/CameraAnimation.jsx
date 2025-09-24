import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";

export default function CameraAnimation({ controlsRef }) {
  const controls = controlsRef.current;
  const tweenRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
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
          controls.setPosition(coords.x, coords.y, coords.z, true);
        })
        .onComplete(() => {
          tweenRef.current = null;
        })
        .start();
    }
  }, [isInitialized]);

  useFrame((state, delta) => {
    if (controls && !isInitialized) {
      setIsInitialized(true);
      return;
    }
    if (tweenRef.current) {
      TWEEN.update(state.clock.elapsedTime * 1000); // Use explicit time
    }
  });

  return null;
}
