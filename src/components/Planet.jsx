import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { useStore } from "../store";
import useTextureLoader from "../utils/useTextureLoader";
import CelestialSphere from "./Helpers/CelestialSphere";
import PolarLine from "./Helpers/PolarLine";
import HoverObj from "../components/HoverObj/HoverObj";
import PlanetRings from "./PlanetRings";
import NameLabel from "./Labels/NameLabel";
import WireFrameSphere from "./Helpers/WireFrameSphere"; // Exact naming

export default function Planet({ s, actualMoon, name }) {
  const groupRef = useRef(); // Group for rotation and scaling
  const planetRef = useRef();
  const materialRef = useRef();
  const posRef = useStore((state) => state.posRef);
  const sunLight = useStore((state) => state.sunLight);
  const planetScale = useStore((state) => state.planetScale);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const { texture, isLoading } = s.texture
    ? useTextureLoader(s.texture)
    : { texture: null, isLoading: false };

  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.map = texture;
      if (s.light) {
        materialRef.current.emissiveMap = texture;
      }
      materialRef.current.needsUpdate = true;
    }
  }, [texture]);

  const rotationSpeed = s.rotationSpeed || 0;
  const rotationStart = s.rotationStart || 0;

  let size = actualPlanetSizes ? s.actualSize : s.size;
  let visible = s.visible;
  if (actualMoon) {
    size = s.actualSize;
    visible = false;
  }

  // Rotate the group containing planet and wireframe
  useFrame(() => {
    if (rotationSpeed && groupRef.current) {
      groupRef.current.rotation.y =
        rotationStart + rotationSpeed * posRef.current;
    }
  });

  const tilt = s.tilt || 0;
  const tiltb = s.tiltb || 0;

  return (
    <group rotation={[tiltb * (Math.PI / 180), 0, tilt * (Math.PI / 180)]}>
      {s.name === "Earth" && <CelestialSphere />}
      {(s.name === "Earth" || s.name === "Sun") && <PolarLine />}
      {visible && <NameLabel s={s} />}
      {visible && <HoverObj s={s} />}
      <group ref={groupRef} scale={planetScale}>
        <mesh name={name} visible={visible} ref={planetRef}>
          <sphereGeometry args={[size, 256, 256]} />
          <meshStandardMaterial
            ref={materialRef}
            color={isLoading || !texture ? s.color : "#ffffff"}
            emissive={s.light && s.color}
            emissiveIntensity={s.light && sunLight}
            roughness={0.7}
            metalness={0.2}
            transparent={s.opacity ? true : false}
            opacity={s.opacity ? s.opacity : 1}
          />
          {s.light && <pointLight intensity={sunLight * 100000} />}
        </mesh>
        <WireFrameSphere s={s} size={size} visible={visible} />
        {s.rings && (
          <PlanetRings
            innerRadius={s.rings.innerRadius + s.size}
            outerRadius={s.rings.outerRadius + s.size}
            texture={s.rings.texture}
            opacity={s.rings.opacity}
            actualSize={s.actualSize}
          />
        )}
      </group>
    </group>
  );
}
