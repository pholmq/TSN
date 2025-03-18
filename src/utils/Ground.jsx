import React from "react";
import { useTexture } from "@react-three/drei";
import { Vector3 } from "three";

export default function Ground({ data, position = [0, 0, 0] }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {data.name === "Earth" ? (
        <Earth data />
      ) : (
        <mesh>
          <circleGeometry args={[data.size, 64]} />
          <meshStandardMaterial color={data.color} opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  );
}
function Earth({ data }) {
  const [texture] = useTexture(["/textures/grass.png"]);
  return (
    <mesh>
      <circleGeometry args={[data.size, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
