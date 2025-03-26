import { useRef } from "react";
import { Line } from "@react-three/drei";

// Component version
export default function PolarLine({ visible }) {
  const points = [
    [0, -100, 0], // bottom point
    [0, 100, 0], // top point
  ];

  return (
    <Line
      points={[
        [0, -100, 0], // bottom point
        [0, 100, 0], // top point
      ]}
      color="white"
      lineWidth={1.5}
    />
  );
}
