// Custom easing: gentle start + quintic out ending
const gentleStartQuinticOut = (t) => {
  // Apply a gentle ease-in to the first part, then quintic out
  const modifiedT = t * t * t; // Square for gentler start
  return 1 - Math.pow(1 - modifiedT, 5); // Then apply quintic out
};
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
        .easing(gentleStartQuinticOut)
        .onUpdate(() => {
          controls.setPosition(coords.x, coords.y, coords.z, true);
        })
        .onComplete(() => {
          tweenRef.current = null;
        })
        .start();
    }
  }, [isInitialized]);

  useFrame(() => {
    if (controls && !isInitialized) {
      setIsInitialized(true);
      return;
    }
    if (tweenRef.current) {
      TWEEN.update();
    }
  });

  return null;
}
