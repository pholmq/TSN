import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { Line } from "@react-three/drei";

// PERFORMANCE FIX: Define arrow assets globally to share GPU resources
const arrowGeometry = new THREE.ConeGeometry(3, 8);
const baseArrowMaterial = new THREE.MeshBasicMaterial({
  opacity: 0.8,
  transparent: true,
});

function Arrow({ rotation, radius, color, reverse = false }) {
  const arrowScale = useStore((s) => s.arrowScale);
  const arrowDirection = reverse ? Math.PI : 0;

  // Clone base material dynamically per orbit color
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

  const showArrows = useStore((s) => s.arrows);
  const showOrbits = useStore((s) => s.orbits);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);

  const { points } = useMemo(() => {
    const pts = [];
    // PERFORMANCE FIX: Changed increment from 0.1 to 1 to eliminate 3,240 unnecessary vertices per orbit
    for (let i = 0; i <= 360; i += 1) {
      const rad = i * (Math.PI / 180);
      pts.push([Math.sin(rad) * radius, Math.cos(rad) * radius, 0]);
    }
    return { points: pts };
  }, [radius]);

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
          points={points}
          color={color}
          lineWidth={orbitsLineWidth}
          dashed={false}
          raycast={() => null}
        />
      </group>
    </>
  );
}
