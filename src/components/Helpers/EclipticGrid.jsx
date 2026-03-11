import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";

export default function EclipticGrid() {
  const eclipticGrid = useStore((s) => s.eclipticGrid);
  const eclipticGridSize = useStore((s) => s.eclipticGridSize);
  const hScale = useStore((s) => s.hScale);

  const gridGroup = useMemo(() => {
    const group = new THREE.Group();

    // Create only the green lines for the X and Z axes
    const points = [
      new THREE.Vector3(-1, 0, 0), // X-axis start
      new THREE.Vector3(1, 0, 0), // X-axis end
      new THREE.Vector3(0, 0, -1), // Z-axis start
      new THREE.Vector3(0, 0, 1), // Z-axis end
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: "#008800" });
    const greenLines = new THREE.LineSegments(geometry, material);

    group.add(greenLines);

    return group;
  }, []); // eclipticGridSize removed from dependency array as it's not used inside useMemo

  if (!eclipticGrid) return null;

  const size = (eclipticGridSize * hScale) / 100;

  return (
    <group position={[0, 0, 0]} scale={[size, size, size]}>
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
