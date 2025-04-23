import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../store";
import { Line } from "@react-three/drei";

function Arrow({ rotation, radius, color, reverse = false }) {
  const arrowScale = useStore((s) => s.arrowScale);

  let arrowDirection = 0;
  if (reverse) {
    arrowDirection = Math.PI;
  }
  return (
    <group rotation={[0, 0, rotation]}>
      <mesh
        position={[radius, 0, 0]}
        rotation={[0, 0, arrowDirection]}
        scale={arrowScale}
      >
        <coneGeometry args={[3, 8]} />
        <meshBasicMaterial color={color} opacity={0.8} transparent />
      </mesh>
    </group>
  );
}

export default function Orbit({ radius, visible, s }) {
  const color = s.color;
  const arrows = s?.arrows ? s.arrows : false;
  const reverse = s?.reverseArrows ? s.reverseArrows : false;
  // const visible = s.visible;

  console.log("arrows: " + arrows, "reverse: " + arrows);

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
      <group visible={showOrbits && visible}>
        <group visible={arrows && showArrows}>
          <Arrow
            rotation={Math.PI / 4}
            radius={radius}
            color={color}
            reverse={reverse}
          />
          <Arrow
            rotation={(Math.PI / 4) * 3}
            radius={radius}
            color={color}
            reverse={reverse}
          />
          <Arrow
            rotation={(Math.PI / 4) * 5}
            radius={radius}
            color={color}
            reverse={reverse}
          />
          <Arrow
            rotation={(Math.PI / 4) * 7}
            radius={radius}
            color={color}
            reverse={reverse}
          />
        </group>

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
