import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { useStore } from "../store";
import useTextureLoader from "../utils/useTextureLoader";
import CelestialSphere from "./Helpers/CelestialSphere";
import PolarLine from "./Helpers/PolarLine";
import HoverObj from "../components/HoverObj/HoverObj";
import PlanetRings from "./PlanetRings";
import NameLabel from "./Labels/NameLabel";
import GeoSphere from "./Helpers/GeoSphere";

export default function Planet({ s, actualMoon, name }) {
  const planetRef = useRef(); // Group for rotation and scaling
  const pivotRef = useRef();
  const materialRef = useRef();
  const posRef = useStore((state) => state.posRef);
  const sunLight = useStore((state) => state.sunLight);
  const planetScale = useStore((state) => state.planetScale);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const geoSphere = useStore((state) => state.geoSphere);
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

  useFrame(() => {
    if (rotationSpeed && planetRef.current) {
      
      // Rotate the group containing the planet
      planetRef.current.rotation.y =
        rotationStart + rotationSpeed * posRef.current;
    }
    if (s.fixedTilt && pivotRef.current) {
      // console.log("iran")
      //Adjust the tilt so that it's fixed in respect to the orbit
      // pivotRef.current.rotation.y = -(s.speed * posRef.current - s.startPos * (Math.PI / 180)) * orbitSpeed;
      pivotRef.current.rotation.z += -0.01;
      // console.log(pivotRef.current.rotation)
    }
  });

  const tilt = s.tilt || 0;
  const tiltb = s.tiltb || 0;

  return (
    <group
      ref={pivotRef}
      rotation={[tiltb * (Math.PI / 180), 0, tilt * (Math.PI / 180)]}
    >
      {s.name === "Earth" && <CelestialSphere />}
      {(s.name === "Earth" || s.name === "Sun") && (
        <PolarLine visible={visible} />
      )}
      {visible && <NameLabel s={s} />}
      {visible && <HoverObj s={s} />}
      <group ref={planetRef} scale={planetScale}>
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
        {s.name === "Earth" && geoSphere ? (
          <GeoSphere s={s} size={size} visible={visible} />
        ) : null}
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
