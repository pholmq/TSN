import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../store";

function CelestialSphere() {
  const celestialSphere = useStore((s) => s.celestialSphere);
  const celestialSphereSize = useStore((s) => s.celestialSphereSize);
  const hScale = useStore((s) => s.hScale);

  const meshRef = useRef();
  const wireframeRef = useRef();

  const size = (celestialSphereSize * hScale) / 100;

  // Recreate PolarGridHelper whenever celestialSphereSize changes
  const polarGrid = useMemo(
    () => new THREE.PolarGridHelper(size, 4, 1, 60, 0x0000ff, 0x0000ff),
    [size] // Now depends on celestialSphereSize
  );

  return (
    <group visible={celestialSphere}>
      <mesh name="CelestialSphere" ref={meshRef}>
        {/* Main sphere */}
        <sphereGeometry args={[size, 40, 40]} />
        <meshNormalMaterial
          transparent
          wireframe={false}
          opacity={0}
          depthWrite={false}
        />

        {/* Wireframe edges */}
        <lineSegments ref={wireframeRef}>
          <edgesGeometry args={[new THREE.SphereGeometry(size, 40, 40)]} />
          <lineBasicMaterial color={0x666666} transparent opacity={0.3} />
        </lineSegments>

        {/* Polar grid helper - will now scale with the sphere */}
        <primitive object={polarGrid} />
      </mesh>
      <mesh name="CSLookAtObj"></mesh>
    </group>
  );
}

export default CelestialSphere;
