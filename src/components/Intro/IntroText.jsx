import React, { useRef, useState } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";

export default function IntroText() {
  const setRunIntro = useStore((s) => s.setRunIntro);
  const materialRef = useRef(); // Create a ref for the material
  const [visible, setVisible] = useState(true);

  // Animate opacity over time using the ref
  useFrame((state, delta) => {
    if (materialRef.current) {
      if (materialRef.current.opacity > 0.01) {
        materialRef.current.opacity = Math.max(
          materialRef.current.opacity - delta * 0.1,
          0
        ); // Fade out slowly
      } else {
        setVisible(false);
        setRunIntro(false);
      }
    }
  });

  return (
    visible && (
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
          ref={materialRef} // Attach ref to material
          color="white"
          metalness={0.2}
          roughness={0.5}
          transparent={true} // Enable transparency
          opacity={1} // Initial opacity (will be controlled by ref)
        />
      </Text3D>
    )
  );
}
