import { useMemo } from "react";
import * as THREE from "three";
import { Text3D, Center } from "@react-three/drei";
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

    // PERFORMANCE FIX: Prevent CPU raycast checks on the grid lines
    greenLines.raycast = () => null;

    group.add(greenLines);

    return group;
  }, []);

  if (!eclipticGrid) return null;

  const size = (eclipticGridSize * hScale) / 100;

  // Use the local font file you already have in your public/fonts folder
  const fontPath = process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"
    : "/fonts/Cambria_Regular.json";

  return (
    <group position={[0, 0, 0]} scale={[size, size, size]}>
      <primitive object={gridGroup} />

      {/* Seasonal Markers */}

      {/* Vernal Equinox (March) - Right (+X) */}
      <Center position={[1, 0.03, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Text3D font={fontPath} size={0.05} height={0.005}>
          <meshBasicMaterial color="#FF4500" />
          {"Summer Solstice"}
        </Text3D>
      </Center>

      {/* Autumnal Equinox (September) - Left (-X) */}
      <Center position={[-1, 0.03, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Text3D font={fontPath} size={0.05} height={0.005}>
          <meshBasicMaterial color="#FF4500" />
          {"Winter Solstice"}
        </Text3D>
      </Center>

      {/* Summer Solstice (June) - Front (+Z) - Facing correct direction */}
      <Center position={[0, 0.03, 1]} rotation={[0, Math.PI, 0]}>
        <Text3D font={fontPath} size={0.05} height={0.005}>
          <meshBasicMaterial color="#FF8C00" />
          {"Vernal Equinox"}
        </Text3D>
      </Center>

      {/* Winter Solstice (December) - Back (-Z) - Facing correct direction */}
      <Center position={[0, 0.03, -1]} rotation={[0, 0, 0]}>
        <Text3D font={fontPath} size={0.05} height={0.005}>
          <meshBasicMaterial color="#FF8C00" />
          {"Autumnal Equinox"}
        </Text3D>
      </Center>
    </group>
  );
}
