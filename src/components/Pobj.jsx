import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useStore, usePlotStore, useSettingsStore } from "../store"; // FIX: Added useStore

// PERFORMANCE FIX: Define geometry globally outside component
const pobjSphere = new THREE.SphereGeometry(1, 32, 32);

// Props come from an object in settings/celestial-model.json (see utils/celestialModel.js):
//   name        scene-graph object name
//   settingName settings entry that drives it (defaults to name)
//   orbitScale  display factor for orbit values while actual sizes are off
const Pobj = ({ name, settingName, orbitScale, children }) => {
  const settingKey = settingName ?? name;

  // PERFORMANCE FIX: Targeted selection to avoid massive re-renders on any setting change
  const s = useSettingsStore(
    useCallback(
      (state) => state.settings.find((p) => p.name === settingKey),
      [settingKey]
    )
  );

  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);
  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes); // FIX: Grab actualPlanetSizes to sync with Cobj

  const containerRef = useRef();
  const pivotRef = useRef();
  const orbitRef = useRef();
  const objRef = useRef();
  const cSphereRef = useRef();

  if (!s) return null;

  // Use exact coordinates directly from the settings store
  let orbitRadius = s.orbitRadius;
  let orbitCentera = s.orbitCentera;
  let orbitCenterb = s.orbitCenterb;
  let orbitCenterc = s.orbitCenterc;

  // FIX: Scale the Moon's plot calculations so the Trace aligns with the visual Moon
  if (!actualPlanetSizes && orbitScale) {
    orbitRadius = s.orbitRadius === 0 ? 0 : s.orbitRadius * orbitScale;
    orbitCentera = s.orbitCentera === 0 ? 0 : s.orbitCentera * orbitScale;
    orbitCenterb = s.orbitCenterb === 0 ? 0 : s.orbitCenterb * orbitScale;
    orbitCenterc = s.orbitCenterc === 0 ? 0 : s.orbitCenterc * orbitScale;
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

    return () => {
      if (removePlotObj) removePlotObj(s.name);
    };
  }, [s.name, s.speed, s.startPos, addPlotObj, removePlotObj]);

  const tilt = s.tilt || 0;
  const tiltb = s.tiltb || 0;

  return (
    <group
      visible={false} // Always hidden, this is the math model
      name="Container"
      ref={containerRef}
      position={[orbitCentera, orbitCenterc, orbitCenterb]}
      rotation-x={(s.orbitTilta || 0) * (Math.PI / 180)}
      rotation-z={(s.orbitTiltb || 0) * (Math.PI / 180)}
    >
      <group name="Orbit" ref={orbitRef}>
        <group name="Pivot" ref={pivotRef} position={[orbitRadius, 0, 0]}>
          <mesh scale={1}>
            <group
              ref={cSphereRef}
              rotation={[tiltb * (Math.PI / 180), 0, tilt * (Math.PI / 180)]}
            >
              <group ref={objRef}>
                <mesh geometry={pobjSphere} scale={s.size || 1}>
                  <meshStandardMaterial color={s.color || "white"} />
                </mesh>
              </group>
            </group>
            {children}
          </mesh>
        </group>
      </group>
    </group>
  );
};

export default Pobj;
