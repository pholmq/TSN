import { Line } from "@react-three/drei";
import { useStore } from "../../store";

// Component version
export default function PolarLine({ visible }) {
  const polarLine = useStore((s) => s.polarLine);
  const southLine = useStore((s) => s.southLine);
  const polarLineSize = useStore((s) => s.polarLineSize);
  const points = [
    [0, -100, 0], // bottom point
    [0, 100, 0], // top point
  ];

  return (
    <>
      {polarLine && visible ? (
        <Line
          points={[
            [0, 0, 0], // bottom point
            [0, polarLineSize, 0], // top point
          ]}
          color="red"
          lineWidth={1.5}
        />
      ) : null}
      {southLine && visible ? (
        <Line
          points={[
            [0, -polarLineSize, 0], // bottom point
            [0, 0, 0], // top point
          ]}
          color="white"
          lineWidth={1.5}
        />
      ) : null}
    </>
  );
}
