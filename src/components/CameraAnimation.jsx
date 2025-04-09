import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export default function CameraAnimation({ controlsRef }) {
  const { camera, gl } = useThree(); // Get gl for the canvas
  const [isInitialized, setIsInitialized] = useState(false);

  const startPos = { x: -30000000, y: 10000000, z: 0 };
  const endPos = { x: 0, y: 2200, z: 0 };

  const initializeAnimation = (controls) => {
    // Slow down the transition
    controls.dampingFactor = 0.5; // Slower movement (default ~0.1)

    controls.setPosition(endPos.x, endPos.y, endPos.z, true); // Smooth transition

    // Handle left mouse click to jump to endPos instantly
    const handleClick = (event) => {
      if (event.button === 0) {
        // Left mouse button
        controls.setPosition(endPos.x, endPos.y, endPos.z, false); // Instant move
      }
    };

    const canvas = gl.domElement; // Use the renderer's canvas
    canvas.addEventListener("click", handleClick);

    // Cleanup
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  };

  useFrame(() => {
    const controls = controlsRef.current;
    if (controls && !isInitialized) {
      const cleanup = initializeAnimation(controls);
      setIsInitialized(true); // Prevent reinitialization
      return cleanup; // Return cleanup function for unmount
    }
  });

  return null;
}
