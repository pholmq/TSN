import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";

// UPDATED EASING: The '8' at the end creates a massive deceleration tail.
// It rushes the first 80% of the journey, then mathematically crawls to the finish.
const gentleStartLongTailOut = (t) => {
  const modifiedT = t * t * t;
  return 1 - Math.pow(1 - modifiedT, 8);
};

export default function CameraAnimation({ controlsRef }) {
  const controls = controlsRef.current;
  const tweenRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const flightPath = useMemo(() => {
    return new THREE.CubicBezierCurve3(
      // P0: Start position (Deep Space)
      new THREE.Vector3(-30000000, 10000000, 0),

      // P1: Dive control point
      new THREE.Vector3(-10000000, 2200, 0),

      // P2: Horizontal slide control point
      // Pulled way back to -25000 to stretch out the final top-down slide
      new THREE.Vector3(-25000, 2200, 0),

      // P3: End position
      new THREE.Vector3(0, 2200, 0)
    );
  }, []);

  // Increased total duration to 15 seconds to give the slow tail room to breathe
  const duration = 15000;

  useEffect(() => {
    if (isInitialized) {
      const startPos = flightPath.getPoint(0);
      controls.setPosition(startPos.x, startPos.y, startPos.z, false);

      const tweenObj = { t: 0 };

      tweenRef.current = new TWEEN.Tween(tweenObj)
        .to({ t: 1 }, duration)
        .easing(gentleStartLongTailOut)
        .onUpdate(() => {
          const currentPos = flightPath.getPoint(tweenObj.t);
          controls.setPosition(currentPos.x, currentPos.y, currentPos.z, false);
        })
        .onComplete(() => {
          tweenRef.current = null;
        })
        .start();
    }
  }, [isInitialized, flightPath]);

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
