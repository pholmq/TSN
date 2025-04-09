import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import TWEEN from "@tweenjs/tween.js";

export default function CameraAnimation({ controlsRef }) {
  const { camera, gl } = useThree();
  const tweenRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const startPos = { x: -30000000, y: 10000000, z: 0 };
  const endPos = { x: 0, y: 2200, z: 0 };
  const duration = 8000; // 8 seconds total, adjusted for sharper effect

  const initializeAnimation = (controls) => {
    console.log("Controls ready, initializing animation...");

    // Set initial position instantly
    controls.setPosition(startPos.x, startPos.y, startPos.z, false);
    console.log("Initial position set:", camera.position.toArray());

    // Setup TWEEN with very fast start, very slow finish
    const coords = { ...startPos };
    tweenRef.current = new TWEEN.Tween(coords)
      .to(endPos, duration)
      .easing(TWEEN.Easing.Quintic.Out) // Steeper curve: very fast start, very slow end
      .onUpdate(() => {
        controls.setPosition(coords.x, coords.y, coords.z, false);
      })
      .onComplete(() => {
        console.log(
          "Animation completed, camera at:",
          camera.position.toArray()
        );
        tweenRef.current = null; // Clear tween reference after completion
      })
      .start();

    // Handle left mouse click to jump to endPos only during animation
    const handleClick = (event) => {
      if (
        event.button === 0 &&
        tweenRef.current &&
        tweenRef.current.isPlaying()
      ) {
        // Left mouse button, only if tween is active
        console.log("Left click detected, jumping to endPos...");
        tweenRef.current.stop(); // Stop the tween
        controls.setPosition(endPos.x, endPos.y, endPos.z, false); // Instant move
        tweenRef.current = null; // Prevent further jumps
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);

    // Cleanup
    return () => {
      if (tweenRef.current) tweenRef.current.stop();
      canvas.removeEventListener("click", handleClick);
    };
  };

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls && !isInitialized) {
      const cleanup = initializeAnimation(controls);
      setIsInitialized(true);
      return cleanup;
    }
    TWEEN.update(); // Update TWEEN every frame
  });

  return null;
}
