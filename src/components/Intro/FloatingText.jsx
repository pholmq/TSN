import React, { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";
import * as THREE from "three";

const DEFAULT_FONT = "/fonts/Cambria_Regular.json";

export default function FloatingText({ cameraPosition }) {
  const textRef = useRef();
  const textGroupRef = useRef();
  const [opacity, setOpacity] = useState(1);
  const [font, setFont] = useState(null);

  // Load font
  useEffect(() => {
    const loader = new THREE.FileLoader();
    loader.load(
      DEFAULT_FONT,
      (json) => {
        try {
          setFont(JSON.parse(json));
          console.log("Font loaded successfully");
        } catch (e) {
          console.error("Font parsing error:", e);
        }
      },
      undefined,
      (err) => console.error("Font loading error:", err)
    );
  }, []);

  useFrame(({ camera }) => {
    if (!textRef.current || !font || !textGroupRef.current) return;

    // Position text at a moderate distance (e.g., 1 million units) in front of camera
    const textDistance = 1000000; // Moderate distance, adjust as needed
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera.quaternion
    );
    const textPosition = new THREE.Vector3()
      .copy(cameraPosition)
      .add(forward.multiplyScalar(textDistance));

    textGroupRef.current.position.copy(textPosition);
    textGroupRef.current.quaternion.copy(camera.quaternion); // Match camera rotation

    // Calculate fade based on distance to end position
    const target = new THREE.Vector3(0, 2200, 0);
    const maxDistance = new THREE.Vector3(-30000000, 10000000, 0).distanceTo(
      target
    );
    const currentDistance = cameraPosition.distanceTo(target);
    const progress = Math.min(1, currentDistance / maxDistance);
    const newOpacity = THREE.MathUtils.lerp(1, 0, progress); // Fade from 1 to 0
    setOpacity(newOpacity);
  });

  if (!font) {
    console.log("Waiting for font to load...");
    return null;
  }

  return (
    <group ref={textGroupRef}>
      <Text3D
        ref={textRef}
        font={font}
        size={50000} // Keeping your original scale
        height={5000}
        curveSegments={4}
        bevelEnabled
        bevelThickness={2000}
        bevelSize={1000}
        bevelOffset={0}
        bevelSegments={3}
      >
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={opacity}
          emissive="#ffffff"
          emissiveIntensity={0.5}
          specular="#ffffff"
          shininess={30}
          side={THREE.DoubleSide}
        />
        HELLO WORLD
      </Text3D>
    </group>
  );
}
