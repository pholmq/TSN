import * as THREE from "three";
import { usePlanetCameraStore } from "./planetCameraStore";

export function Ground() {
  const groundSize = usePlanetCameraStore((s) => s.groundSize) / 10000;
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);

  // Define colors for each planet
  const planetGroundColors = {
    Earth: {
      ground: "#003300", // Dark green
      horizon: "#004400", // Slightly lighter green (very subtle)
    },
    Moon: {
      ground: "#4A4A4A", // Medium gray
      horizon: "#8B8B8B", // Lighter gray
    },
    Mars: {
      ground: "#B7410E", // Rust orange-red
      horizon: "#D2691E", // Chocolate/tan
    },
    Mercury: {
      ground: "#696969", // Dim gray (darker than Moon)
      horizon: "#A9A9A9", // Dark gray (lighter than ground)
    },
    Venus: {
      ground: "#B8860B", // Dark goldenrod
      horizon: "#DAA520", // Lighter goldenrod
    },
    Sun: {
      ground: "#FFA500", // Orange
      horizon: "#FFD700", // Gold
    },
  };

  // Get colors for current planet, default to Earth if not found
  const colors =
    planetGroundColors[planetCameraTarget] || planetGroundColors.Earth;

  return (
    <group>
      {/* Horizon ring (torus) - slightly brighter/different color */}
      <mesh rotation-x={-Math.PI / 2}>
        <torusGeometry args={[groundSize, groundSize / 200, 32, 100]} />
        <meshBasicMaterial
          color={colors.horizon}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.1}
        />
      </mesh>

      {/* Ground hemisphere */}
      <mesh rotation-x={Math.PI}>
        <sphereGeometry
          args={[groundSize, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshBasicMaterial
          color={colors.ground}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={1}
        />
      </mesh>
    </group>
  );
}
