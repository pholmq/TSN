// src/components/Pobj.jsx
import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useStore, usePlotStore, useSettingsStore } from "../store";

const pobjSphere = new THREE.SphereGeometry(1, 32, 32);

const Pobj = ({ name, settingName, orbitScale, children }) => {
  const settingKey = settingName ?? name;
  const s = useSettingsStore(
    useCallback(
      (state) => state.settings.find((p) => p.name === settingKey),
      [settingKey]
    )
  );

  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);
  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes); 

  const containerRef = useRef();
  const pivotRef = useRef();
  const orbitRef = useRef();
  const objRef = useRef();
  const cSphereRef = useRef();

  if (!s) return null;

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
      visible={false}
      name="Container"
      ref={containerRef}
      position={[orbitCenterx, orbitCentery, orbitCenterz]}
      rotation-x={(s.orbitTiltx || 0) * (Math.PI / 180)}
      rotation-y={(s.orbitTilty || 0) * (Math.PI / 180)}
      rotation-z={(s.orbitTiltz || 0) * (Math.PI / 180)}
    >
      <group name="Orbit" ref={orbitRef}>
        <group name={`${name}-Pivot`} ref={pivotRef} position={[orbitRadius, 0, 0]}>
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