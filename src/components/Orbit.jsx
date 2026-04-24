import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../store";
import { Line } from "@react-three/drei";
import createCircleTexture from "../utils/createCircleTexture";

const arrowGeometry = new THREE.ConeGeometry(3, 8);
const baseArrowMaterial = new THREE.MeshBasicMaterial({
  opacity: 0.8,
  transparent: true,
});

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

  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    if (meshRef.current) {
      if (globalArrowFixedSize) {
        meshRef.current.scale.setScalar(globalArrowSize * 0.2);
      } else {
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
  const localShadeOrbit = s?.shadeOrbit || false;
  const localOrbitVisible =
    s?.orbitVisible !== undefined ? s.orbitVisible : true;
  const reverse = s?.reverseArrows || false;

  const showOrbits = useStore((s) => s.orbits);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);
  const editSettings = useStore((s) => s.editSettings);
  const shadeOrbits = useStore((s) => s.shadeOrbits);
  const globalArrowCount = useStore((s) => s.globalArrowCount);

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

  const arrowsToRender = useMemo(() => {
    const elements = [];
    const step = (Math.PI * 2) / globalArrowCount;
    const offset = step / 2;

    for (let i = 0; i < globalArrowCount; i++) {
      elements.push(
        <Arrow
          key={i}
          rotation={i * step + offset}
          radius={safeRadius}
          color={color}
          reverse={reverse}
        />
      );
    }
    return elements;
  }, [globalArrowCount, safeRadius, color, reverse]);

  const { points, centerToEdgePoints, edgePosition } = useMemo(() => {
    const pts = [];
    const stepSize = safeRadius > 50000 ? 0.2 : safeRadius > 10000 ? 0.5 : 1;

    for (let i = 0; i <= 360; i += stepSize) {
      const rad = i * (Math.PI / 180);
      pts.push([Math.sin(rad) * safeRadius, Math.cos(rad) * safeRadius, 0]);
    }

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
      <group visible={showOrbits && visible && localOrbitVisible}>
        {(shadeOrbits || localShadeOrbit) && (
          <mesh
            material={shadeMaterial}
            position={[0, 0, -safeRadius * 0.00001]}
            renderOrder={-1}
          >
            <circleGeometry args={[safeRadius, 128]} />
          </mesh>
        )}

        <group visible={showOrbitArrows}>{arrowsToRender}</group>

        <Line
          points={points}
          color={color}
          lineWidth={orbitsLineWidth}
          dashed={false}
          raycast={() => null}
          toneMapped={false}
        />

        {editSettings && (
          <>
            <Line
              points={centerToEdgePoints}
              color={color}
              lineWidth={orbitsLineWidth}
              dashed={false}
              raycast={() => null}
              toneMapped={false}
            />
            <sprite material={spriteMaterial} scale={[0.002, 0.002, 0.002]} />
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
