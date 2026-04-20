import * as THREE from "three";
import { usePlanetCameraStore } from "./planetCameraStore";
import { useSettingsStore } from "../../store";

export function Ground() {
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);
  const targetData = useSettingsStore((s) => s.getSetting(planetCameraTarget));

  const groundColor = targetData?.groundColor || "#000080";
  const horizonColor = targetData?.horizonColor || "#0000a0";

  const groundSize = 0.015;

  return (
    <group>
      {/* Horizon ring - Base opacity 0.1 */}
      <mesh
        rotation-x={-Math.PI / 2}
        userData={{ baseOpacity: 0.2, isHorizon: true }}
        raycast={() => null}
      >
        <torusGeometry args={[groundSize * 0.97, 0.0001, 16, 64]} />
        <meshBasicMaterial
          color={horizonColor}
          transparent={true}
          opacity={0.2} // Add this so it starts faint before the animation frame kicks in
          depthWrite={false}
        />
      </mesh>

      {/* ADDED: isBowl: true */}
      <mesh
        rotation-x={Math.PI}
        userData={{ baseOpacity: 0.7, isBowl: true }}
        raycast={() => null}
      >
        <sphereGeometry
          args={[groundSize, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshBasicMaterial
          color={groundColor}
          side={THREE.BackSide}
          transparent={true}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
