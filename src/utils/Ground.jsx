import React from "react";
import { useTexture } from "@react-three/drei";
import { Vector3 } from "three";
import { useSettingsStore } from "../store.js"

export default function Ground({ planet, position = [0, 0, 0] }) {
  const getSetting = useSettingsStore((state) => state.getSetting);
  const s = getSetting(planet)
console.log(s)

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {s.name === "Earth" ? (
        <Earth s />
      ) : (
        <mesh>
          <circleGeometry args={[s.size, 64]} />
          <meshStandardMaterial color={s.color} opacity={0.5} transparent />
        </mesh>
      )}
    </group>
  );
}
function Earth({ s }) {
  const [texture] = useTexture(["/textures/grass.png"]);
  return (
    <mesh>
      <circleGeometry args={[s.size, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
