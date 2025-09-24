import { useEffect, useRef, useState } from "react";
import TWEEN from "@tweenjs/tween.js";

export default function CameraAnimation({ controlsRef }) {
  const controls = controlsRef.current;
  const tweenRef = useRef(null);
  const animationIdRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const startPos = { x: -30000000, y: 10000000, z: 0 };
  const endPos = { x: 0, y: 2200, z: 0 };
  const duration = 8000;
  const initialDelay = 500; // Wait 500ms before starting animation

  // Initialize the camera position
  useEffect(() => {
    if (controls && !isInitialized) {
      controls.setPosition(startPos.x, startPos.y, startPos.z, false);
      setIsInitialized(true);

      // Wait a bit for the scene to settle before starting animation
      setTimeout(() => {
        setIsReady(true);
      }, initialDelay);
    }
  }, [controls, isInitialized]);

  // Start animation when ready
  useEffect(() => {
    if (!isReady || !controls) return;

    const coords = { ...startPos };

    // Create the tween animation
    tweenRef.current = new TWEEN.Tween(coords)
      .to(endPos, duration)
      .easing(TWEEN.Easing.Quintic.Out)
      .onUpdate(() => {
        controls.setPosition(coords.x, coords.y, coords.z, true);
      })
      .onComplete(() => {
        tweenRef.current = null;
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
      })
      .start();

    // Animation loop using requestAnimationFrame with frame skipping
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (time) => {
      if (tweenRef.current) {
        // Skip frames if we're running too fast
        if (time - lastTime >= frameInterval) {
          TWEEN.update(time);
          lastTime = time;
        }
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (tweenRef.current) {
        tweenRef.current.stop();
        tweenRef.current = null;
      }
    };
  }, [isReady, controls]);

  return null;
}
