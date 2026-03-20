import React, { useRef, useState, useEffect } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";
import TychosLogo3D from "./TychosLogo3D";

export default function IntroText() {
  const runIntro = useStore((s) => s.runIntro);
  const setRunIntro = useStore((s) => s.setRunIntro);

  const materialRef = useRef();
  const warningMaterialRef = useRef();
  const logoMaterialRef = useRef();

  // NEW: Timer to hold the text at 100% opacity before fading
  const holdTimer = useRef(0);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFinished, setIsFinished] = useState(!runIntro);

  // --- ANIMATION CONTROLS ---
  const holdDuration = 4.0; // Seconds to hold before fading begins
  const normalFadeSpeed = 0.05; // Lower number = slower fade out
  const skipFadeSpeed = 0.2; // Fast fade if user clicks to skip

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hasTouchEvents = "ontouchstart" in window;

    if (isCoarsePointer || hasTouchEvents) {
      setIsTouchDevice(true);
    }
  }, []);

  useEffect(() => {
    if (runIntro) {
      setIsFinished(false);
      holdTimer.current = 0; // Reset timer on replay
      if (materialRef.current) materialRef.current.opacity = 1;
      if (warningMaterialRef.current) warningMaterialRef.current.opacity = 1;
      if (logoMaterialRef.current) logoMaterialRef.current.opacity = 1;
    }
  }, [runIntro]);

  useFrame((state, delta) => {
    if (isFinished) return;

    // Wait before fading, UNLESS the user clicked to skip (runIntro becomes false)
    if (runIntro && holdTimer.current < holdDuration) {
      holdTimer.current += delta;
      return;
    }

    if (materialRef.current && materialRef.current.opacity > 0.01) {
      const fadeSpeed = runIntro ? normalFadeSpeed : skipFadeSpeed;

      const newOpacity = Math.max(
        materialRef.current.opacity - delta * fadeSpeed,
        0
      );

      materialRef.current.opacity = newOpacity;
      if (warningMaterialRef.current)
        warningMaterialRef.current.opacity = newOpacity;
      if (logoMaterialRef.current) logoMaterialRef.current.opacity = newOpacity;
    } else {
      setIsFinished(true);
      if (runIntro) {
        setRunIntro(false);
      }
    }
  });

  if (isFinished) return null;

  const titlePosition = isTouchDevice ? [-140, 0, -90] : [-140, 0, -150];
  const warningPos = [-180, 0, -100];
  const logoPosition = isTouchDevice ? [-125, 0, -125] : [-125, 0, -185];

  return (
    <>
      <TychosLogo3D
        materialRef={logoMaterialRef}
        position={logoPosition}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      />

      <Text3D
        font={process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"}
        position={titlePosition}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        size={isTouchDevice ? 20 : 30}
        height={8}
        curveSegments={12}
        bevelEnabled
        bevelThickness={5}
        bevelSize={0.3}
        bevelOffset={0}
        bevelSegments={8}
      >
        The Tychosium
        <meshStandardMaterial
          ref={materialRef}
          color="white"
          metalness={0.2}
          roughness={0.5}
          transparent={true}
          opacity={1}
        />
      </Text3D>

      {isTouchDevice && (
        <Text3D
          font={process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"}
          position={warningPos}
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
          size={10}
          height={2}
          curveSegments={12}
          bevelEnabled
          bevelThickness={1}
          bevelSize={0.1}
          bevelOffset={0}
          bevelSegments={4}
        >
          Optimized for Mouse & Keyboard
          <meshStandardMaterial
            ref={warningMaterialRef}
            color="#FFFFFF"
            metalness={0.2}
            roughness={0.5}
            transparent={true}
            opacity={1}
          />
        </Text3D>
      )}
    </>
  );
}
