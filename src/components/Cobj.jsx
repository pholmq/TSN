import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore, useSettingsStore } from "../store";
import Planet from "./Planet";
import Orbit from "./Orbit";
import Deferent from "./Deferent";
import EclipticGrid from "./Helpers/EclipticGrid";
import usePlanetSpeed from "../utils/usePlanetSpeed";
import { OrbitDisplacementLine, OrbitCenterLabel } from "./Helpers/OrbitVisualizer";

const Cobj = ({ name, settingName, orbitScale, hosts = [], children }) => {
  const { settings } = useSettingsStore();
  const { scene } = useThree();
  const s = settings.find((p) => p.name === (settingName ?? name));
  const visible = s.visible;

  const containerRef = useRef();
  const orbitRef = useRef();
  const pivotRef = useRef();
  const posRef = useStore((s) => s.posRef);

  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes);
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);
  const editSettings = useStore((s) => s.editSettings);
  const showOrbitLabels = useStore((s) => s.showOrbitLabels);

  useFrame(() => {
    orbitRef.current.rotation.y =
      s.speed * posRef.current - s.startPos * (Math.PI / 180);
  });

  let orbitRadius = s.orbitRadius;
  let orbitCenterx = s.orbitCenterx || 0;
  let orbitCentery = s.orbitCentery || 0;
  let orbitCenterz = s.orbitCenterz || 0;

  if (!actualPlanetSizes && orbitScale) {
    orbitRadius = s.orbitRadius === 0 ? 0 : s.orbitRadius * orbitScale;
    orbitCenterx = s.orbitCenterx === 0 ? 0 : s.orbitCenterx * orbitScale;
    orbitCentery = s.orbitCentery === 0 ? 0 : s.orbitCentery * orbitScale;
    orbitCenterz = s.orbitCenterz === 0 ? 0 : s.orbitCenterz * orbitScale;
  }

  const hasDisplacement =
    orbitCenterx !== 0 || orbitCentery !== 0 || orbitCenterz !== 0;

  usePlanetSpeed(name, s, orbitRadius, scene);

  // Visualizers only render if Edit Settings is open AND the toggle is checked
  const showVisualizers = editSettings && visible && showOrbitLabels;

  return (
    <>
      {/* 1. Global Displacement Line */}
      {hasDisplacement && showVisualizers && (
        <OrbitDisplacementLine 
          center={[orbitCenterx, orbitCentery, orbitCenterz]} 
          lineWidth={orbitsLineWidth} 
        />
      )}

      {/* 2. The Core Object Container */}
      <group
        name="Container"
        ref={containerRef}
        position={[orbitCenterx, orbitCentery, orbitCenterz]}
        rotation-x={(s.orbitTiltx || 0) * (Math.PI / 180)}
        rotation-y={(s.orbitTilty || 0) * (Math.PI / 180)}
        rotation-z={(s.orbitTiltz || 0) * (Math.PI / 180)}
      >
        {/* 3. Edit Mode Visualizers (Axes & Screen-space Label) */}
        {showVisualizers && <OrbitCenterLabel name={name} radius={orbitRadius} />}

        <group name="Orbit" ref={orbitRef}>
          {orbitRadius !== undefined && orbitRadius !== null ? (
            <group rotation-x={-Math.PI / 2}>
              {s.type === "deferent" ? (
                <Deferent radius={orbitRadius} visible={visible} s={s} />
              ) : (
                <Orbit radius={orbitRadius} visible={visible} s={s} />
              )}
            </group>
          ) : null}
          <group name="Pivot" ref={pivotRef} position={[orbitRadius, 0, 0]}>
            {s.axesHelper && visible ? <axesHelper args={[10]} /> : null}
            {s.type === "planet" ? <Planet s={s} name={name} /> : null}
            {hosts.includes("ecliptic-grid") ? <EclipticGrid /> : null}
            {children}
          </group>
        </group>
      </group>
    </>
  );
};
export default Cobj;