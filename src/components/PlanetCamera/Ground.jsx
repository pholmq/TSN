import * as THREE from "three";
import { Html } from "@react-three/drei";
export function Ground({ size = 100 }) {
  const textStyle = {
    color: "red",
    fontSize: "25px",
    userSelect: "none",
  };

  return (
    <>
      <axesHelper args={[40]} position={[0, 0, 0]} />
      <group rotation-x={Math.PI}>
        {/* <torusGeometry args={[size, 0.003, 32, 100]} />
        <meshBasicMaterial color={0xffff00} side={THREE.DoubleSide} /> */}
        {/* <mesh position={[0, 0, 0]} rotation-x={Math.PI}>
            <circleGeometry args={[100, 32]} />
            <meshStandardMaterial
              color="green"
              transparent={true}
              opacity={0.5}
            />
          </mesh> */}

        <mesh>
          <sphereGeometry
            args={[size, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color="green"
            transparent={true}
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* <Html
          rotation-x={-Math.PI / 2}
          position={[0, -size, 0]}
          style={textStyle}
        >
          N
        </Html>
        <Html
          rotation-x={-Math.PI / 2}
          position={[0, size, 0]}
          style={textStyle}
        >
          S
        </Html>
        <Html
          rotation-x={-Math.PI / 2}
          position={[-size, -0, 0]}
          style={textStyle}
        >
          W
        </Html>
        <Html
          rotation-x={-Math.PI / 2}
          position={[size, 0, 0]}
          style={textStyle}
        >
          E
        </Html> */}
      </group>
    </>
  );
}
