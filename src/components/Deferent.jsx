import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../store";
import { Line } from "@react-three/drei";

export default function Orbit({ radius, visible, s }) {
  return null;
  const color = s.color;
  const arrows = s?.arrows ? s.arrows : false;
  const reverse = s?.reverseArrows ? s.reverseArrows : false;
  // const visible = s.visible;

  const orbitRef = useRef();

  const showArrows = useStore((s) => s.arrows);
  const showOrbits = useStore((s) => s.orbits);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);

  let points = [];
  let arrowPoints = [];
  let arrowStepSize = 45;

  // // 360 full circle will be drawn clockwise
  // for (let i = 0; i <= 360; i++) {
  for (let i = 0; i <= 360; i = i + 0.1) {
    points.push([
      Math.sin(i * (Math.PI / 180)) * radius,
      Math.cos(i * (Math.PI / 180)) * radius,
      0,
    ]);
    if (i === arrowStepSize) {
      arrowPoints.push([
        Math.sin(i * (Math.PI / 180)) * radius,
        Math.cos(i * (Math.PI / 180)) * radius,
        0,
      ]);
      arrowStepSize += arrowStepSize;
    }
  }

  return (
    <>
      <group visible={showOrbits}>
        <Line
          points={points} // Array of points
          color={color} // Default
          lineWidth={orbitsLineWidth} // In pixels (default)
          dashed={false}
        />
      </group>
    </>
  );
}
