import { useRef, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export function PlanetRings({ innerRadius, outerRadius, texture }) {
  const ringRef = useRef();
  const [ringTexture] = useTexture([texture]);

  // Ensure the texture repeats itself
  ringTexture.wrapS = THREE.RepeatWrapping;
  ringTexture.wrapT = THREE.RepeatWrapping;

  // Set how many times you want the texture to repeat around the ring
  ringTexture.repeat.set(4, 1); // 4 repetitions around, adjust as needed

  const ringGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

    // Access the UV attribute safely
    const uvAttribute = geometry.attributes.uv;

    // Modify the UVs using set methods, without direct array access
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      const v = uvAttribute.getY(i);

      // Convert UV coordinates to polar coordinates
      const angle = Math.atan2(v - 0.5, u - 0.5); // Angle in radians
      const radius = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2); // Radial distance

      // Remap UV coordinates to follow the circular ring
      uvAttribute.setXY(i, radius, angle / (2 * Math.PI)); // Correct UV mapping for repeating texture
    }

    // Mark the UV attribute as updated
    uvAttribute.needsUpdate = true;

    return geometry;
  }, [innerRadius, outerRadius]);

  // Standard material with texture applied
  const ringMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: ringTexture, // Apply the texture
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [ringTexture]);

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <primitive object={ringGeometry} />
      <primitive object={ringMaterial} />
    </mesh>
  );
}
