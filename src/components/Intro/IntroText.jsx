import React, { useRef, useState, useEffect } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";
import TychosLogo3D from "./TychosLogo3D";

// --- STRICT TIMING CONSTANTS ---
const TYCHOSIUM_DURATION = 2.0; // Seconds before main title starts fading
const WARNING_DURATION = 8.0; // Seconds before warning text starts fading
const FADE_SPEED = 0.05; // Consistent slow fade speed

export default function IntroText() {
  const runIntro = useStore((s) => s.runIntro);
  const setRunIntro = useStore((s) => s.setRunIntro);

  const materialRef = useRef();
  const warningMaterialRef = useRef();
  const logoMaterialRef = useRef();

  // This timer runs independently of the global runIntro state
  const holdTimer = useRef(0);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFinished, setIsFinished] = useState(!runIntro);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hasTouchEvents = "ontouchstart" in window;

    if (isCoarsePointer || hasTouchEvents) {
      setIsTouchDevice(true);
    }
  }, []);

  useFrame((state, delta) => {
    if (isFinished) return;

    // 1. Advance the text's internal timer regardless of what the intro sequence is doing
    holdTimer.current += delta;

    let mainDone = false;
    let warningDone = false;

    // 2. Fade Main Title and Logo purely based on time
    if (holdTimer.current > TYCHOSIUM_DURATION) {
      if (materialRef.current) {
        let currentOp = materialRef.current.opacity;
        if (currentOp === undefined) currentOp = 1; // Failsafe for R3F first-frame render

        if (currentOp > 0.01) {
          const newOp = Math.max(0, currentOp - delta * FADE_SPEED);
          materialRef.current.opacity = newOp;
          if (logoMaterialRef.current) logoMaterialRef.current.opacity = newOp;
        } else {
          mainDone = true;
        }
      }
    }

    // 3. Fade Warning Text purely based on time
    if (!isTouchDevice) {
      warningDone = true;
    } else if (holdTimer.current > WARNING_DURATION) {
      if (warningMaterialRef.current) {
        let currentOp = warningMaterialRef.current.opacity;
        if (currentOp === undefined) currentOp = 1;

        if (currentOp > 0.01) {
          const newOp = Math.max(0, currentOp - delta * FADE_SPEED);
          warningMaterialRef.current.opacity = newOp;
        } else {
          warningDone = true;
        }
      }
    }

    // 4. Cleanup: Only unmount text when both are fully transparent
    if (mainDone && warningDone) {
      setIsFinished(true);
      // Just in case the camera animation hasn't already unlocked the UI, ensure it does here
      if (runIntro) {
        setRunIntro(false);
      }
    }
  });

  if (isFinished) return null;

  const titlePosition = isTouchDevice ? [-140, 0, -80] : [-140, 0, -150];
  const warningPos = [-180, 0, -130];
  const logoPosition = isTouchDevice ? [-125, 0, -115] : [-125, 0, -185];

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
          emissive="white"
          emissiveIntensity={0.2} // Slight glow to ensure it isn't grey
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
          size={12}
          height={3}
          curveSegments={12}
          bevelEnabled
          bevelThickness={1}
          bevelSize={0.1}
          bevelOffset={0}
          bevelSegments={4}
        >
          Keyboard and mouse recommended
          <meshStandardMaterial
            ref={warningMaterialRef}
            color="white"
            emissive="white"
            emissiveIntensity={0.8} // High intensity so it pops
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
