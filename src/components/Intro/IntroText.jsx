import React, { useRef } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";

export default function IntroText() {
  const runIntro = useStore((s) => s.runIntro);
  const materialRef = useRef();

  // Animate opacity over time using the ref
  useFrame((state, delta) => {
    if (materialRef.current && materialRef.current.opacity > 0.01) {
      materialRef.current.opacity = Math.max(
        materialRef.current.opacity - delta * 0.07,
        0
      );
    }
  });

  // Don't render if intro is not running
  if (!runIntro) return null;

  return (
    <Text3D
      font="/fonts/Cambria_Regular.json"
      position={[-140, 0, -230]}
      rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      size={40}
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
  );
}
