import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useStore, usePlotStore, useSettingsStore } from "../store";

const pobjSphere = new THREE.SphereGeometry(1, 32, 32);

const Pobj = ({ name, children }) => {
  // Back to normal: Watch the live settings store
  const s = useSettingsStore(
    useCallback((state) => state.settings.find((p) => p.name === name), [name])
  );

  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);

  // Notice: We don't pull actualPlanetSizes here anymore.
  // The backend plot models MUST ALWAYS use mathematically exact distances.
  // If we spoof the Moon's distance for visual scale, the Ephemeris check will be wildly incorrect!

  const containerRef = useRef();
  const pivotRef = useRef();
  const orbitRef = useRef();
  const objRef = useRef();
  const cSphereRef = useRef();

  if (!s) return null;

  const orbitRadius = s.orbitRadius;
  const orbitCentera = s.orbitCentera;
  const orbitCenterb = s.orbitCenterb;
  const orbitCenterc = s.orbitCenterc;

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
