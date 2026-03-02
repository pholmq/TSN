import * as THREE from "three";
import { usePlanetCameraStore } from "./planetCameraStore";

export function Ground() {
  const groundSize = usePlanetCameraStore((s) => s.groundSize) / 10000;
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  const planetGroundColors = {
    Earth: { ground: "#003300", horizon: "#004400" },
    Moon: { ground: "#4A4A4A", horizon: "#8B8B8B" },
    Mars: { ground: "#B7410E", horizon: "#D2691E" },
    Mercury: { ground: "#696969", horizon: "#A9A9A9" },
    Venus: { ground: "#B8860B", horizon: "#DAA520" },
    Sun: { ground: "#FFA500", horizon: "#FFD700" },
  };

  const colors =
    planetGroundColors[planetCameraTarget] || planetGroundColors.Earth;

  return (
    <group>
      {/* Horizon ring - Base opacity 0.1 */}
      <mesh rotation-x={-Math.PI / 2} userData={{ baseOpacity: 0.1 }}>
        <torusGeometry args={[groundSize, groundSize / 200, 32, 100]} />
        <meshBasicMaterial
          color={colors.horizon}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.1}
        />
      </mesh>

      {/* Ground hemisphere - Base opacity 0.7 (Slightly transparent!) */}
      <mesh rotation-x={Math.PI} userData={{ baseOpacity: 0.7 }}>
        <sphereGeometry
          args={[groundSize, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshBasicMaterial
          color={colors.ground}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
