import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, memo } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { usePlanetCameraStore } from "./PlanetCamera/planetCameraStore";
import useTextureLoader from "../utils/useTextureLoader";
import CelestialSphere from "./Helpers/CelestialSphere";
import PolarLine from "./Helpers/PolarLine";
import TropicalZodiac from "./Helpers/TropicalZodiac";
import HoverObj from "../components/HoverObj/HoverObj";
import PlanetRings from "./PlanetRings";
import NameLabel from "./Labels/NameLabel";
import GeoSphere from "./Helpers/GeoSphere";

const Planet = memo(function Planet({ s, actualMoon, name }) {
  const planetRef = useRef();
  const pivotRef = useRef();
  const materialRef = useRef();
  const posRef = useStore((state) => state.posRef);
  const sunLight = useStore((state) => state.sunLight);
  const planetScale = useStore((state) => state.planetScale);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const geoSphere = useStore((state) => state.geoSphere);
  const planetCamera = useStore((state) => state.planetCamera);
  const planetCameraTarget = usePlanetCameraStore(
    (state) => state.planetCameraTarget
  );

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);

  const cameraTransitioning = useStore((s) => s.cameraTransitioning);

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
  }, [texture, s.light]);

  const rotationSpeed = Number(s.rotationSpeed || 0);
  const rotationStart = Number(s.rotationStart || 0);

  let size = actualPlanetSizes ? s.actualSize : s.size;
  let visible = s.visible;
  if (actualMoon) {
    size = s.actualSize;
    visible = false;
  }

  useFrame(() => {
    if (s.fixedTilt && pivotRef.current) {
      pivotRef.current.rotation.y = -(
        s.speed * posRef.current -
        s.startPos * (Math.PI / 180)
      );
    }

    if (planetRef.current) {
      planetRef.current.rotation.y =
        rotationStart + rotationSpeed * posRef.current;

      // --- NEW: Update selected position if this planet is selected ---
      const myID = `Planet:${name}`;
      if (selectedStarHR === myID) {
        const vec = new THREE.Vector3();
        planetRef.current.getWorldPosition(vec);
        setSelectedStarPosition(vec);
      }
    }
  });

  const tilt = Number(s.tilt || 0);
  const tiltb = Number(s.tiltb || 0);

  const showLabel =
    visible &&
    !(planetCamera && !cameraTransitioning && name === planetCameraTarget);

  return (
    <group>
      {s.name === "Earth" && <TropicalZodiac />}
      <group
        ref={pivotRef}
        rotation={[tiltb * (Math.PI / 180), 0, tilt * (Math.PI / 180)]}
      >
        {s.name === "Earth" && <CelestialSphere />}

        {(s.name === "Earth" || s.name === "Sun") && (
          <PolarLine visible={visible} />
        )}
        {showLabel && <NameLabel s={s} />}
        {showLabel && <HoverObj s={s} />}
        <group ref={planetRef} scale={planetScale}>
          <mesh name={name} visible={visible} ref={planetRef}>
            <sphereGeometry args={[size, 256, 256]} />
            <meshStandardMaterial
              ref={materialRef}
              color={
                isLoading || !texture ? s.color : s.textureTint || "#ffffff"
              }
              emissive={s.light && s.color}
              emissiveIntensity={s.light && sunLight}
              roughness={0.7}
              metalness={0.2}
              transparent={true}
              opacity={s.opacity ? s.opacity : 1}
              depthWrite={false}
            />
            {s.light && <pointLight intensity={sunLight * 100000} />}
          </mesh>
          {s.geoSphere && geoSphere ? (
            <GeoSphere
              s={s}
              size={size}
              visible={visible}
              color={s.geoSphereColor}
            />
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
    </group>
  );
});

export default Planet;
