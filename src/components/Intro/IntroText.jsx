import React from "react";
import { Canvas } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";

export default function IntroText() {
  return (
    <Text3D
      font="/fonts/Cambria_Regular.json"
      position={[-200, 0, -400]} // Adjusted position to be more visible
      rotation={[-Math.PI / 2, 0, -Math.PI / 2]} // Adjusted rotation for better viewing
      size={70} // Text scale
      height={5} // Increased depth for box-like appearance
      curveSegments={12}
      bevelEnabled
      bevelThickness={0.2} // Slightly increased bevel for visibility
      bevelSize={0.2}
      bevelOffset={0}
      bevelSegments={5}
    >
      The TYCHOSIUM
      <meshStandardMaterial
        color="white"
        metalness={0.2} // Adds slight metallic look
        roughness={0.5} // Controls reflection
      />
    </Text3D>
  );
}
