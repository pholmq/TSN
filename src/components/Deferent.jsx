import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../store";
import { Line } from "@react-three/drei";

export default function Orbit({ radius, visible, s }) {
  const color = s.color;
  const arrows = s?.arrows ? s.arrows : false;
  const reverse = s?.reverseArrows ? s.reverseArrows : false;
  // const visible = s.visible;

  const orbitRef = useRef();

  const showDeferents = useStore((s) => s.showDeferents);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);

  // Subtract 90 degrees from the current angle (0 degrees)
  const startAngle = +90 * (Math.PI / 180); // Convert -90 degrees to radians

  const centerToEdgePoints = [
    [0, 0, 0], // Center point
    [Math.sin(Math.PI / 2) * radius, Math.cos(Math.PI / 2) * radius, 0], // Edge point at -π/2 rad
    // [Math.sin(startAngle) * radius, Math.cos(startAngle) * radius, 0], // Edge point at -90 degr
    // [Math.sin(0) * radius, Math.cos(0) * radius, 0], // Edge point at start angle (0 degrees)
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

  return (
    <>
      <group visible={visible}>
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
      </group>
    </>
  );
}
