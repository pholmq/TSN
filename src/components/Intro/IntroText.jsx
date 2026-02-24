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
  const logoMaterialRef = useRef(); // Ref for the 3D logo

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Decouple the banner's existence from runIntro so it can finish fading out
  const [isFinished, setIsFinished] = useState(!runIntro);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hasTouchEvents = "ontouchstart" in window;

    if (isCoarsePointer || hasTouchEvents) {
      setIsTouchDevice(true);
    }
  }, []);

  // If the intro is ever reset/replayed, reset the banner
  useEffect(() => {
    if (runIntro) {
      setIsFinished(false);
      if (materialRef.current) materialRef.current.opacity = 1;
      if (warningMaterialRef.current) warningMaterialRef.current.opacity = 1;
      if (logoMaterialRef.current) logoMaterialRef.current.opacity = 1;
    }
  }, [runIntro]);

  useFrame((state, delta) => {
    if (isFinished) return;

    // Only fade if opacity is significantly above 0
    if (materialRef.current && materialRef.current.opacity > 0.01) {
      // Fade twice as fast if the user clicked to interrupt (runIntro === false)
      const fadeSpeed = runIntro ? 0.07 : 0.14;

      const newOpacity = Math.max(
        materialRef.current.opacity - delta * fadeSpeed,
        0
      );
      materialRef.current.opacity = newOpacity;

      if (warningMaterialRef.current) {
        warningMaterialRef.current.opacity = newOpacity;
      }

      if (logoMaterialRef.current) {
        logoMaterialRef.current.opacity = newOpacity;
      }
    } else {
      // Once faded out, turn off the flag and unmount
      setIsFinished(true);
      // Only clear runIntro if it's still true (user might have already clicked through)
      if (runIntro) {
        setRunIntro(false);
      }
    }
  });

  if (isFinished) return null;

  const titlePosition = [-140, 0, -150];
  const warningPos = [-180, 0, -100];

  // Adjusted to sit much closer to the left of the title
  const logoPosition = [-125, 0, -185];

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
        size={30}
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
          size={20}
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
