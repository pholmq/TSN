import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../../store";

const MARKER_SIZE = 0.02;
const shaftLength = MARKER_SIZE;
const shaftRadius = MARKER_SIZE * 0.05;
const headLength = MARKER_SIZE * 0.2;
const headRadius = MARKER_SIZE * 0.15;

const shaftGeo = new THREE.CylinderGeometry(
  shaftRadius,
  shaftRadius,
  shaftLength,
  8
);
const headGeo = new THREE.ConeGeometry(headRadius, headLength, 8);

// 1. Add transparent: true and depthWrite: false
const whiteMat = new THREE.MeshBasicMaterial({
  color: "white",
  depthTest: false,
  depthWrite: false,
  transparent: true, // Forces evaluation in the transparent pass
  opacity: 1,
});

const redMat = new THREE.MeshBasicMaterial({
  color: "red",
  depthTest: false,
  depthWrite: false,
  transparent: true,
  opacity: 1,
});

export default function PlanetCameraHelper() {
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  const { scene } = useThree();
  const groupRef = useRef(null);

  useFrame(() => {
    if (!planetCameraHelper || !groupRef.current) return;

    const cam = scene.getObjectByName("PlanetCamera");

    if (cam) {
      cam.updateMatrixWorld(true);
      cam.getWorldPosition(groupRef.current.position);
      cam.getWorldQuaternion(groupRef.current.quaternion);
    }
  });

  if (!planetCameraHelper) return null;

  // 2. Ensure renderOrder is extremely high
  return (
    <group ref={groupRef}>
      {/* WHITE ARROW: FORWARD (-Z) */}
      <group position={[0, 0, -shaftLength / 2]}>
        <mesh
          geometry={shaftGeo}
          material={whiteMat}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={9999}
        />
        <mesh
          geometry={headGeo}
          material={whiteMat}
          position={[0, 0, -shaftLength / 2 - headLength / 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={9999}
        />
      </group>

      {/* RED ARROW: UP (+Y) */}
      <group position={[0, shaftLength / 2, 0]}>
        <mesh geometry={shaftGeo} material={redMat} renderOrder={9999} />
        <mesh
          geometry={headGeo}
          material={redMat}
          position={[0, shaftLength / 2 + headLength / 2, 0]}
          renderOrder={9999}
        />
      </group>
    </group>
  );
}
