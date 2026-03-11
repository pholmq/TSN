import React, { useMemo, useEffect } from "react";
import * as THREE from "three";
import { Torus, Sphere, Cone } from "@react-three/drei";

export default function TychosLogo3D({ materialRef, ...props }) {
  // Create ONE material instance so fading it applies to ALL parts of the logo simultaneously
  const logoMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  // Bind the shared material to the ref provided by the parent (IntroText)
  useEffect(() => {
    if (materialRef) {
      materialRef.current = logoMat;
    }
  }, [logoMat, materialRef]);

  const tubeThickness = 4;

  return (
    <group scale={0.15} {...props}>
      {/* --- Main Orbits --- */}
      <Torus args={[175, tubeThickness, 16, 64]} material={logoMat} />
      <Torus args={[80, tubeThickness, 16, 64]} material={logoMat} />
      <Torus args={[45, tubeThickness, 16, 64]} material={logoMat} />

      {/* --- Lower Intersecting Orbit (Mars Deferent) --- */}
      <Torus
        args={[122, tubeThickness, 16, 64]}
        position={[0, -122, 0]}
        material={logoMat}
      />

      {/* --- Lowest Small Orbit --- */}
      <Torus
        args={[49, tubeThickness, 16, 64]}
        position={[0, -171, 0]}
        material={logoMat}
      />

      {/* --- Solid Bodies --- */}
      <Sphere args={[15, 32, 32]} material={logoMat} />
      <Sphere args={[14, 32, 32]} position={[0, -122, 0]} material={logoMat} />
      <Sphere args={[10, 32, 32]} position={[0, 175, 0]} material={logoMat} />

      {/* --- Sun Rays (8 points) --- */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
          <Cone args={[4, 15, 4]} position={[0, 22.5, 0]} material={logoMat} />
        </group>
      ))}
    </group>
  );
}
