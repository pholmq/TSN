import * as THREE from "three";
import { Html } from "@react-three/drei";

export function Ground({ size = 0.01 }) {
  return (
    <>
      {/* <axesHelper args={[40]} position={[0, 0, 0]} /> */}
      <group>
        <mesh rotation-x={-Math.PI / 2}>
          <torusGeometry args={[size, size / 200, 32, 100]} />
          <meshBasicMaterial
            color="green"
            side={THREE.DoubleSide}
            transparent={true}
            opacity={1}
          />
        </mesh>

        <mesh rotation-x={Math.PI}>
          <sphereGeometry
            args={[size, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshBasicMaterial
            color="#003300"
            side={THREE.DoubleSide}
            transparent={true}
            opacity={1}
          />
        </mesh>
      </group>
    </>
  );
}
