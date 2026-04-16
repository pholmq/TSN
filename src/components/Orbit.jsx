import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { Line } from "@react-three/drei";
import createCircleTexture from "../utils/createCircleTexture";

// PERFORMANCE FIX: Shared arrow materials
const arrowGeometry = new THREE.ConeGeometry(3, 8);
const baseArrowMaterial = new THREE.MeshBasicMaterial({
  opacity: 0.8,
  transparent: true,
});

// PERFORMANCE FIX: Hoist red dot sprite materials
const circleTexture = createCircleTexture("red");
const spriteMaterial = new THREE.SpriteMaterial({
  map: circleTexture,
  transparent: true,
  opacity: 1,
  sizeAttenuation: false,
});

function Arrow({ rotation, radius, color, reverse = false }) {
  const arrowScale = useStore((s) => s.arrowScale);
  const arrowDirection = reverse ? Math.PI : 0;

  const mat = useMemo(() => {
    const m = baseArrowMaterial.clone();
    m.color.set(color);
    return m;
  }, [color]);

  return (
    <group rotation={[0, 0, rotation]}>
      <mesh
        position={[radius, 0, 0]}
        rotation={[0, 0, arrowDirection]}
        scale={arrowScale}
        geometry={arrowGeometry}
        material={mat}
      />
    </group>
  );
}

export default function Orbit({ radius, visible, s }) {
  const color = s.color;
  const arrows = s?.arrows ? s.arrows : false;
  const reverse = s?.reverseArrows ? s.reverseArrows : false;

  const showOrbits = useStore((s) => s.orbits);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);

  // 1. Pull editSettings from the store
  const editSettings = useStore((s) => s.editSettings);

  const shadeOrbits = useStore((s) => s.shadeOrbits);

  // BUG FIX: Prevent NaN mathematical collapse for planets at center (radius 0)
  const safeRadius = radius === 0 ? 0.000001 : radius;

  const shadeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [color]);

  // Export the edge position so we can use it for the second red dot
  const { points, centerToEdgePoints, edgePosition } = useMemo(() => {
    const pts = [];
    const stepSize = safeRadius > 50000 ? 0.2 : safeRadius > 10000 ? 0.5 : 1;

    for (let i = 0; i <= 360; i += stepSize) {
      const rad = i * (Math.PI / 180);
      pts.push([Math.sin(rad) * safeRadius, Math.cos(rad) * safeRadius, 0]);
    }

    // Calculate center-to-edge pointer
    const edgePos = [
      Math.sin(Math.PI / 2) * safeRadius,
      Math.cos(Math.PI / 2) * safeRadius,
      0,
    ];
    const centerEdge = [[0, 0, 0], edgePos];

    return {
      points: pts,
      centerToEdgePoints: centerEdge,
      edgePosition: edgePos,
    };
  }, [safeRadius]);

  return (
    <>
      <group visible={showOrbits && visible}>
        {shadeOrbits && (
          <mesh material={shadeMaterial}>
            <circleGeometry args={[safeRadius, 128]} />
          </mesh>
        )}
        <group visible={arrows}>
          <Arrow
            rotation={Math.PI / 4}
            radius={safeRadius}
            color={color}
            reverse={reverse}
          />
          <Arrow
            rotation={(Math.PI / 4) * 3}
            radius={safeRadius}
            color={color}
            reverse={reverse}
          />
          <Arrow
            rotation={(Math.PI / 4) * 5}
            radius={safeRadius}
            color={color}
            reverse={reverse}
          />
          <Arrow
            rotation={(Math.PI / 4) * 7}
            radius={safeRadius}
            color={color}
            reverse={reverse}
          />
        </group>

        <Line
          points={points}
          color={color}
          lineWidth={orbitsLineWidth}
          dashed={false}
          raycast={() => null}
        />

        {/* 2. Conditionally render the center red dot, radius line, and edge red dot */}
        {editSettings && (
          <>
            <Line
              points={centerToEdgePoints}
              color={color}
              lineWidth={orbitsLineWidth}
              dashed={false}
            />
            {/* Center dot */}
            <sprite material={spriteMaterial} scale={[0.002, 0.002, 0.002]} />
            {/* Edge dot */}
            <sprite
              material={spriteMaterial}
              position={edgePosition}
              scale={[0.002, 0.002, 0.002]}
            />
          </>
        )}
      </group>
    </>
  );
}
