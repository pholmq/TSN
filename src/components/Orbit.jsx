//Orbit
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
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
  const meshRef = useRef();
  const globalArrowSize = useStore((s) => s.globalArrowSize);
  const globalArrowFixedSize = useStore((s) => s.globalArrowFixedSize);
  const arrowDirection = reverse ? Math.PI : 0;

  const mat = useMemo(() => {
    const m = baseArrowMaterial.clone();
    m.color.set(color);
    return m;
  }, [color]);

  // Use a pre-allocated vector to prevent recreating objects in the animation loop
  const vec = useMemo(() => new THREE.Vector3(), []);

  // Ensure arrow stays the same apparent size regardless of camera distance
  useFrame(({ camera }) => {
    if (meshRef.current) {
      if (globalArrowFixedSize) {
        // Fixed size in the 3D world (gets smaller as you zoom out)
        // Multiplier 0.2 means a slider value of 5 equals a scale of 1.0
        meshRef.current.scale.setScalar(globalArrowSize * 0.2);
      } else {
        // Dynamic size (stays the same apparent size on screen)
        meshRef.current.getWorldPosition(vec);
        const distance = camera.position.distanceTo(vec);
        const dynamicScale = distance * globalArrowSize * 0.0001;
        meshRef.current.scale.setScalar(dynamicScale);
      }
    }
  });

  return (
    <group rotation={[0, 0, rotation]}>
      <mesh
        ref={meshRef}
        position={[radius, 0, 0]}
        rotation={[0, 0, arrowDirection]}
        geometry={arrowGeometry}
        material={mat}
      />
    </group>
  );
}

export default function Orbit({ radius, visible, s }) {
  const color = s.color;
  const showOrbitArrows = s?.orbitArrowsVisible || false;
  const reverse = s?.reverseArrows || false;

  const showOrbits = useStore((s) => s.orbits);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);
  const editSettings = useStore((s) => s.editSettings);
  const shadeOrbits = useStore((s) => s.shadeOrbits);
  const globalArrowCount = useStore((s) => s.globalArrowCount);

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

  // Distribute arrows evenly based on global count
  const arrowsToRender = useMemo(() => {
    const elements = [];
    const step = (Math.PI * 2) / globalArrowCount;

    // FIX: Offset by half a step so arrows don't spawn exactly at 0 degrees
    // This perfectly matches your original 45/135/225/315 degree placements
    const offset = step / 2;

    for (let i = 0; i < globalArrowCount; i++) {
      elements.push(
        <Arrow
          key={i}
          rotation={i * step + offset} // Applied offset here
          radius={safeRadius}
          color={color}
          reverse={reverse}
        />
      );
    }
    return elements;
  }, [globalArrowCount, safeRadius, color, reverse]);

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

        {/* Visibility driven by specific planet setting */}
        <group visible={showOrbitArrows}>{arrowsToRender}</group>

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
