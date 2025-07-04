import { useRef } from "react";
import { SpriteMaterial } from "three";

import { useFrame } from "@react-three/fiber";
import { useStore } from "../store";
import { Line } from "@react-three/drei";
import HoverObj from "../components/HoverObj/HoverObj";
import createCircleTexture from "../utils/createCircleTexture";

export default function Orbit({ radius, visible, s }) {
  const color = s.color;
  const arrows = s?.arrows ? s.arrows : false;
  const reverse = s?.reverseArrows ? s.reverseArrows : false;
  // const visible = s.visible;

  const orbitRef = useRef();

  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);

  const edgePosition = [
    Math.sin(Math.PI / 2) * radius,
    Math.cos(Math.PI / 2) * radius,
    0,
  ];

  const centerToEdgePoints = [
    [0, 0, 0], // Center point
    edgePosition,
  ];

  let points = [];

  // // 360 full circle will be drawn clockwise
  // for (let i = 0; i <= 360; i++) {
  for (let i = 0; i <= 360; i = i + 0.1) {
    points.push([
      Math.sin(i * (Math.PI / 180)) * radius,
      Math.cos(i * (Math.PI / 180)) * radius,
      0,
    ]);
  }

  const markerSize = s.orbitRadius < 0.01 ? 0.01 : s.orbitRadius / 100;

  const circleTexture = createCircleTexture("red");
  const spriteMaterial = new SpriteMaterial({
    map: circleTexture,
    transparent: true,
    opacity: 1,
    sizeAttenuation: false,
    // depthTest: false,
  });

  return (
    <>
      <group visible={visible} name={s.name}>
        {visible && <HoverObj s={s} />}
        <Line
          points={points} // Array of points
          color={color} // Default
          lineWidth={orbitsLineWidth} // In pixels (default)
          dashed={false}
        />
        <Line
          points={centerToEdgePoints}
          color={color}
          lineWidth={orbitsLineWidth}
          dashed={false}
        />
        <sprite material={spriteMaterial} scale={[0.005, 0.005, 0.005]} />
        {/* <mesh>
          <sphereGeometry args={[markerSize, 32, 32]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={edgePosition}>
          <sphereGeometry args={[markerSize, 32, 32]} />
          <meshBasicMaterial color="red" />
        </mesh> */}
      </group>
    </>
  );
}
