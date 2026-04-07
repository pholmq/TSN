import { useMemo } from "react";
import { SpriteMaterial } from "three";
import { useStore } from "../store";
import { Line } from "@react-three/drei";
import HoverObj from "../components/HoverObj/HoverObj";
import createCircleTexture from "../utils/createCircleTexture";

// PERFORMANCE FIX: Hoisted outside the component to prevent memory leaks
// and re-allocations on every render.
const circleTexture = createCircleTexture("red");
const spriteMaterial = new SpriteMaterial({
  map: circleTexture,
  transparent: true,
  opacity: 1,
  sizeAttenuation: false,
});

export default function Orbit({ radius, visible, s }) {
  const color = s.color;
  const orbitsLineWidth = useStore((state) => state.orbitsLineWidth);

  // BUG FIX: Prevent mathematical collapse in Drei's <Line>.
  // If radius is exactly 0, Line2 generates NaN tangents/bounding boxes,
  // which can corrupt the group's rendering and hide the sprite.
  const safeRadius = radius === 0 ? 0.000001 : radius;

  // PERFORMANCE FIX: Wrap the 3,600 iteration loop in a useMemo so we
  // only crunch this math when the radius actually changes.
  const { points, centerToEdgePoints } = useMemo(() => {
    const edgePosition = [
      Math.sin(Math.PI / 2) * safeRadius,
      Math.cos(Math.PI / 2) * safeRadius,
      0,
    ];

    const centerEdge = [[0, 0, 0], edgePosition];
    const circlePoints = [];

    for (let i = 0; i <= 360; i += 0.1) {
      circlePoints.push([
        Math.sin(i * (Math.PI / 180)) * safeRadius,
        Math.cos(i * (Math.PI / 180)) * safeRadius,
        0,
      ]);
    }

    return { points: circlePoints, centerToEdgePoints: centerEdge };
  }, [safeRadius]);

  return (
    <group visible={visible} name={s.name}>
      {visible && <HoverObj s={s} />}

      <Line
        points={points}
        color={color}
        lineWidth={orbitsLineWidth}
        dashed={false}
      />

      <Line
        points={centerToEdgePoints}
        color={color}
        lineWidth={orbitsLineWidth}
        dashed={false}
      />

      {/* Sprite is back, exactly as you had it */}
      <sprite material={spriteMaterial} scale={[0.002, 0.002, 0.002]} />
    </group>
  );
}
