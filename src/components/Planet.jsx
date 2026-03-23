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
import NameLabel from "./Labels/NameLabelBillboard";
import GeoSphere from "./Helpers/GeoSphere";

// PERFORMANCE FIX: Define geometries globally to share across all planet instances
const lowResSphere = new THREE.SphereGeometry(1, 64, 64);
const highResSphere = new THREE.SphereGeometry(1, 128, 128); // Reserved for Earth

// Define reusable vector outside to prevent GC pressure
const worldPositionVec = new THREE.Vector3();

const Planet = memo(function Planet({ s, actualMoon, name }) {
  const planetRef = useRef();
  const transformRef = useRef();
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
    }
  });

  const tilt = Number(s.tilt || 0);
  const tiltb = Number(s.tiltb || 0);

  const showLabel =
    visible &&
    !(planetCamera && !cameraTransitioning && name === planetCameraTarget);

  const planetGeometry = s.name === "Earth" ? highResSphere : lowResSphere;

  const planetOpacity = s.opacity !== undefined ? s.opacity : 1;
  const isTransparent = planetOpacity < 1;

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

        <group ref={transformRef} scale={planetScale}>
          {/* THE FIX: Unscaled wrapper group for the camera to safely mount to */}
          <group name={name} ref={planetRef} visible={visible}>
            <mesh geometry={planetGeometry} scale={size}>
              <meshStandardMaterial
                ref={materialRef}
                color={
                  isLoading || !texture ? s.color : s.textureTint || "#ffffff"
                }
                emissive={s.light && s.color}
                emissiveIntensity={s.light && sunLight}
                roughness={0.7}
                metalness={0.2}
                transparent={isTransparent}
                opacity={planetOpacity}
                depthWrite={!isTransparent}
              />
              {s.light && <pointLight intensity={sunLight * 100000} />}
            </mesh>
          </group>
          {/* The Helpers remain as siblings so their internal scaling calculations hold true */}
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
