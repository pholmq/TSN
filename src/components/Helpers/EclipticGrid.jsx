import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";

export default function EclipticGrid() {
  const eclipticGrid = useStore((s) => s.eclipticGrid);
  const eclipticGridSize = useStore((s) => s.eclipticGridSize);

  const gridGroup = useMemo(() => {
    const group = new THREE.Group();

    // Create the main grid helper
    const grid = new THREE.GridHelper(
      2,
      30,
      "#008800",
      "#000088"
    );
    group.add(grid);

    return group;
  }, [eclipticGridSize]);

  if (!eclipticGrid) return null;

  return (
    <group scale={[eclipticGridSize, eclipticGridSize, eclipticGridSize]}>
      <primitive object={gridGroup} />

      {/* Seasonal Markers */}

      {/* Vernal Equinox (March) - Right (+X) */}
      <Text
        position={[1, 0.03, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.05}
        color="#FF4500"
        anchorX="center"
        anchorY="middle"
      >
        Summer Solstice
      </Text>

      {/* Autumnal Equinox (September) - Left (-X) */}
      <Text
        position={[-1, 0.03, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.05}
        color="#FF4500"
        anchorX="center"
        anchorY="middle"
      >
        Winter Solstice
      </Text>

      {/* Summer Solstice (June) - Front (+Z) - Facing correct direction */}
      <Text
        position={[0, 0.03, 1]}
        rotation={[0, Math.PI, 0]} // Flipped 180 degrees
        fontSize={0.05}
        color="#FF8C00"
        anchorX="center"
        anchorY="middle"
      >
        Vernal Equinox
      </Text>

      {/* Winter Solstice (December) - Back (-Z) - Facing correct direction */}
      <Text
        position={[0, 0.03, -1]}
        rotation={[0, 0, 0]} // Reset to 0 rotation
        fontSize={0.05}
        color="#FF8C00"
        anchorX="center"
        anchorY="middle"
      >
        Autumnal Equinox
      </Text>
    </group>
  );
}
