import React, { useRef, useState, useEffect } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";

export default function IntroText() {
  const runIntro = useStore((s) => s.runIntro);
  const setRunIntro = useStore((s) => s.setRunIntro);
  const materialRef = useRef();
  const warningMaterialRef = useRef(); // New ref for the warning text material

  // State to track if the device is touch-enabled
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check for touch capabilities on mount
  useEffect(() => {
    // Use modern CSS media query for "coarse" pointer (standard for touchscreens)
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    // Check for 'ontouchstart' event for broader compatibility
    const hasTouchEvents = 'ontouchstart' in window;
    
    if (isCoarsePointer || hasTouchEvents) {
      setIsTouchDevice(true);
    }
  }, []);

  // Animate opacity over time using the ref
  useFrame((state, delta) => {
    if (!runIntro) return;
    if (materialRef.current && materialRef.current.opacity > 0.01) {
      const newOpacity = Math.max(
        materialRef.current.opacity - delta * 0.07,
        0
      );
      materialRef.current.opacity = newOpacity;

      // Apply the same fade to the warning text material if it exists
      if (warningMaterialRef.current) {
        warningMaterialRef.current.opacity = newOpacity;
      }
    } else {
      // End the introduction once the text is fully faded
      setRunIntro(false);
    }
  });

  // Don't render if intro is not running
  if (!runIntro) return null;

  // Title position and size constants for easy reference and alignment
  const titlePosition = [-140, 0, -100];
  const warningPos = [-180, 0, -100]; 

  return (
    <>
      {/* Main Title Text: "The TYCHOSIUM" */}
      <Text3D
        font={process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"}
        position={titlePosition}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        size={20}
        height={8}
        curveSegments={12}
        bevelEnabled
        bevelThickness={5}
        bevelSize={0.3}
        bevelOffset={0}
        bevelSegments={8}
      >
        The TYCHOSIUM
        <meshStandardMaterial
          ref={materialRef}
          color="white"
          metalness={0.2}
          roughness={0.5}
          transparent={true}
          opacity={1}
        />
      </Text3D>
      
      {/* Conditional Warning Text for Touch Devices, positioned below the title */}
      {isTouchDevice && (
        <Text3D
        font={process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"}
          // Shifted position to be visually 'under' the main title (adjusting X coordinate)
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
            color="#FFD700" // Yellow/Gold color for a warning hint
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