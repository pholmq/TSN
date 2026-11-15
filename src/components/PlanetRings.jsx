import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../store";

export default function PlanetRings({
  innerRadius,
  outerRadius,
  planetSize,
  texture,
  opacity,
  actualSize,
}) {
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);

  // Create the correct path. In production Electron, this needs to be relative.
  const texturePath = process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL + "/" + texture
    : texture;

  const [ringTexture] = useTexture([texturePath]);

  // The texture's horizontal axis represents the radial band pattern. It
  // should span the annulus once; repetition creates artificial bands.
  ringTexture.wrapS = THREE.ClampToEdgeWrapping;
  ringTexture.wrapT = THREE.RepeatWrapping;
  ringTexture.repeat.set(1, 1);

  // Preserve the visual ring-to-planet ratio in physical-size mode. The old
  // fixed division placed Saturn's outer ring on the planet surface.
  const visualPlanetRadius = Number(planetSize || 1);
  const physicalPlanetRadius = Number(actualSize || 0);
  const safeInnerRadius = actualPlanetSizes
    ? (Number(innerRadius) / visualPlanetRadius) * physicalPlanetRadius
    : Number(innerRadius);
  const safeOuterRadius = actualPlanetSizes
    ? (Number(outerRadius) / visualPlanetRadius) * physicalPlanetRadius
    : Number(outerRadius);

  // Create ring geometry with UV mapping
  const ringGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(
      safeInnerRadius,
      safeOuterRadius,
      64
    );
    const uvAttribute = geometry.attributes.uv;
    const positions = geometry.attributes.position.array;

    // Map the complete texture width once across the annulus.
    for (let i = 0; i < uvAttribute.count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const radius = Math.hypot(x, y);
      const radialPosition =
        (radius - safeInnerRadius) /
        Math.max(safeOuterRadius - safeInnerRadius, Number.EPSILON);
      const angle = Math.atan2(y, x);
      uvAttribute.setXY(
        i,
        THREE.MathUtils.clamp(radialPosition, 0, 1),
        angle / (2 * Math.PI) + 0.5
      );
    }
    uvAttribute.needsUpdate = true;
    geometry.computeBoundingSphere();

    return geometry;
  }, [safeInnerRadius, safeOuterRadius]);

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
    <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <primitive object={ringGeometry} />
      <primitive object={ringMaterial} />
    </mesh>
  );
}
