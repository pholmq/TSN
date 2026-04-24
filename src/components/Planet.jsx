import { useFrame } from "@react-three/fiber";
import { useRef, memo, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { usePlanetCameraStore } from "./PlanetCamera/planetCameraStore";
import useTextureLoader from "../utils/useTextureLoader";
import CelestialSphere from "./Helpers/CelestialSphere";
import PolarLine from "./Helpers/PolarLine";
import TropicalZodiac from "./Helpers/TropicalZodiac";
import HoverObj from "../components/HoverObj/HoverObj";
import PlanetRings from "./PlanetRings";
import NameLabel from "./Labels/NameLabelBillboard";
import GeoSphere from "./Helpers/GeoSphere";

// PERFORMANCE: Define geometries and constants globally to share across all planet instances
const lowResSphere = new THREE.SphereGeometry(1, 64, 64);
const highResSphere = new THREE.SphereGeometry(1, 128, 128); // Reserved for Earth
const DEG2RAD = THREE.MathUtils.DEG2RAD; // Pre-calculated constant

const Planet = memo(function Planet({ s, actualMoon, name }) {
  const planetRef = useRef();
  const transformRef = useRef();
  const pivotRef = useRef();

  const posRef = useStore((state) => state.posRef);
  const sunLight = useStore((state) => state.sunLight);
  const getPlanetScale = useStore((state) => state.planetScale);
  const planetCamera = useStore((state) => state.planetCamera);
  // No scaling if planet camera is active
  const planetScale = planetCamera ? 1 : getPlanetScale;

  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const geoSphere = useStore((state) => state.geoSphere);
  const planetCameraTarget = usePlanetCameraStore(
    (state) => state.planetCameraTarget
  );
  const cameraTransitioning = useStore((state) => state.cameraTransitioning);
  const editSettings = useStore((state) => state.editSettings);
  const showPlanets = useStore((state) => state.showPlanets);

  const { texture, isLoading } = s.texture
    ? useTextureLoader(s.texture)
    : { texture: null, isLoading: false };

  // PERFORMANCE: Memoize material properties to avoid GC pressure and diffing on every render
  const isTransparent = s.opacity !== undefined ? s.opacity < 1 : false;
  const planetOpacity = s.opacity !== undefined ? s.opacity : 1;
  const materialProps = useMemo(
    () => ({
      color: isLoading || !texture ? s.color : s.textureTint || "#ffffff",
      emissive: s.light ? s.color : "#000000",
      emissiveIntensity: s.light ? sunLight : 0,
      roughness: 0.7,
      metalness: 0.2,
      transparent: isTransparent,
      opacity: planetOpacity,
      depthWrite: !isTransparent,
      visible: !editSettings || showPlanets,
    }),
    [
      texture,
      isLoading,
      s,
      sunLight,
      editSettings,
      showPlanets,
      isTransparent,
      planetOpacity,
    ]
  );

  const rotationSpeed = Number(s.rotationSpeed || 0);
  const rotationStart = Number(s.rotationStart || 0);
  const speed = Number(s.speed || 0);
  const startPosRad = Number(s.startPos || 0) * DEG2RAD;

  let size = actualPlanetSizes ? s.actualSize : s.size;

  // FIX: Force Earth to use actualSize when planetCamera is active
  if (planetCamera && s.name === "Earth") {
    size = s.actualSize;
  }

  let visible = s.visible;
  if (actualMoon) {
    size = s.actualSize;
    visible = false;
  }

  useFrame(() => {
    if (s.fixedTilt && pivotRef.current) {
      // Use pre-calculated DEG2RAD to avoid math inside the loop
      pivotRef.current.rotation.y = -(speed * posRef.current - startPosRad);
    }
    if (planetRef.current) {
      planetRef.current.rotation.y =
        rotationStart + rotationSpeed * posRef.current;
    }
  });

  const tiltRad = Number(s.tilt || 0) * DEG2RAD;
  const tiltbRad = Number(s.tiltb || 0) * DEG2RAD;

  const showLabel =
    visible &&
    !(planetCamera && !cameraTransitioning && name === planetCameraTarget);
  const planetGeometry = s.name === "Earth" ? highResSphere : lowResSphere;

  return (
    <group>
      {s.name === "Earth" && <TropicalZodiac />}
      <group ref={pivotRef} rotation={[tiltbRad, 0, tiltRad]}>
        {s.name === "Earth" && <CelestialSphere />}

        <PolarLine visible={visible} name={name} />
        {showLabel && <NameLabel s={s} />}
        {showLabel && <HoverObj s={s} />}

        <group ref={transformRef} scale={planetScale}>
          {s.light && <pointLight intensity={sunLight * 100000} />}

          <group name={name} ref={planetRef} visible={visible}>
            <mesh geometry={planetGeometry} scale={size}>
              <meshStandardMaterial
                map={texture}
                emissiveMap={s.light ? texture : null}
                {...materialProps}
              />
            </mesh>
          </group>

          {s.geoSphere && geoSphere && (
            <GeoSphere
              s={s}
              size={size}
              visible={visible}
              color={s.geoSphereColor}
            />
          )}

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
