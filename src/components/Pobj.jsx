import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useStore, usePlotStore, useSettingsStore } from "../store";

// PERFORMANCE FIX: Define geometry globally outside component
const pobjSphere = new THREE.SphereGeometry(1, 32, 32);

const Pobj = ({ name, children }) => {
  // PERFORMANCE FIX: Targeted selection to avoid massive re-renders on any setting change
  const s = useSettingsStore(
    useCallback((state) => state.settings.find((p) => p.name === name), [name])
  );

  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  // Ensure you add a removePlotObj function to your usePlotStore!
  const removePlotObj = usePlotStore((state) => state.removePlotObj);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);

  const containerRef = useRef();
  const pivotRef = useRef();
  const orbitRef = useRef();
  const objRef = useRef();
  const cSphereRef = useRef();

  if (!s) return null;

  let orbitRadius = s.orbitRadius;
  let orbitCentera = s.orbitCentera;
  let orbitCenterb = s.orbitCenterb;
  let orbitCenterc = s.orbitCenterc;

  if (!actualPlanetSizes) {
    if (
      s.name === "Moon" ||
      s.name === "Moon deferent A" ||
      s.name === "Moon deferent B"
    ) {
      orbitRadius = s.orbitRadius === 0 ? 0 : s.orbitRadius * 39.2078;
      orbitCentera = s.orbitCentera === 0 ? 0 : s.orbitCentera * 39.2078;
      orbitCenterb = s.orbitCenterb === 0 ? 0 : s.orbitCenterb * 39.2078;
      orbitCenterc = s.orbitCenterc === 0 ? 0 : s.orbitCenterc * 39.2078;
    }
  }

  useEffect(() => {
    const plotObj = {
      name: s.name,
      speed: s.speed,
      startPos: s.startPos,
      orbitRef: orbitRef,
      pivotRef: pivotRef,
      cSphereRef: cSphereRef,
    };
    addPlotObj(plotObj);

    // PERFORMANCE FIX: Cleanup to prevent memory leaks / ghost trace objects
    return () => {
      if (removePlotObj) removePlotObj(s.name);
    };
  }, [s.name, s.speed, s.startPos, addPlotObj, removePlotObj]);

  const tilt = s.tilt || 0;
  const tiltb = s.tiltb || 0;

  return (
    <group
      visible={false}
      name="Container"
      ref={containerRef}
      position={[orbitCentera, orbitCenterc, orbitCenterb]}
      rotation-x={s.orbitTilta * (Math.PI / 180)}
      rotation-z={s.orbitTiltb * (Math.PI / 180)}
    >
      <group name="Orbit" ref={orbitRef}>
        <group name="Pivot" ref={pivotRef} position={[orbitRadius, 0, 0]}>
          <mesh scale={1}>
            {s.type === "planet" ? (
              <group
                ref={cSphereRef}
                rotation={[tiltb * (Math.PI / 180), 0, tilt * (Math.PI / 180)]}
              >
                {/* PERFORMANCE FIX: Use shared geometry and scale it */}
                <mesh ref={objRef} geometry={pobjSphere} scale={s.size}>
                  <meshStandardMaterial color={s.color} />
                </mesh>
              </group>
            ) : null}
            {children}
          </mesh>
        </group>
      </group>
    </group>
  );
};

export default Pobj;
