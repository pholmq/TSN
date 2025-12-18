import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../store";

export default function PlanetRings({
  innerRadius,
  outerRadius,
  texture,
  opacity,
  actualSize,
}) {
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);

  // Create the correct path. In production Electron, this needs to be relative.
  const texturePath = process.env.PUBLIC_URL 
    ? process.env.PUBLIC_URL + '/' + texture 
    : texture;

  const [ringTexture] = useTexture([texturePath]);

  // Configure texture
  ringTexture.wrapS = ringTexture.wrapT = THREE.RepeatWrapping;
  ringTexture.repeat.set(4, 1);

  // Validate radii
  // const safeInnerRadius =
  //   isNaN(innerRadius) || innerRadius <= 0 ? 1 : Number(innerRadius);
  // const safeOuterRadius =
  //   isNaN(outerRadius) || outerRadius <= safeInnerRadius
  //     ? safeInnerRadius + 1
  //     : Number(outerRadius);

  // Validate radii
  const safeInnerRadius = actualPlanetSizes
    ? (innerRadius * actualSize) / 6
    : Number(innerRadius);
  const safeOuterRadius = actualPlanetSizes
    ? (outerRadius * actualSize) / 6
    : Number(outerRadius);
  actualPlanetSizes;
  // Create ring geometry with UV mapping
  const ringGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(
      safeInnerRadius,
      safeOuterRadius,
      64
    );
    const uvAttribute = geometry.attributes.uv;

    // Modify UVs for polar mapping
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      const v = uvAttribute.getY(i);

      // Convert to polar coordinates
      const angle = Math.atan2(v - 0.5, u - 0.5);
      const radius = Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2);

      // Remap UVs for circular texture
      uvAttribute.setXY(i, radius, angle / (2 * Math.PI));
    }
    uvAttribute.needsUpdate = true;

    // Debug: Check for NaN in position attribute
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i++) {
      if (isNaN(positions[i])) {
        console.error(`NaN found in position attribute at index ${i}`);
      }
    }

    // Compute bounding sphere to catch issues
    geometry.computeBoundingSphere();

    return geometry;
  }, [safeInnerRadius, safeOuterRadius, actualPlanetSizes]);

  // Create material
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: ringTexture,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
      }),
    [ringTexture, opacity]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <primitive object={ringGeometry} />
      <primitive object={ringMaterial} />
    </mesh>
  );
}
