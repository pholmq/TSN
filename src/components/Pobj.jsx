// src/components/Pobj.jsx
import { useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useStore, usePlotStore, useSettingsStore } from "../store";
import { celestialModel } from "../utils/celestialModel";

const pobjSphere = new THREE.SphereGeometry(1, 32, 32);

let cachedMoonChainNames = null;
const getMoonChainNames = () => {
  if (cachedMoonChainNames) return cachedMoonChainNames;
  cachedMoonChainNames = new Set();
  let current = celestialModel.objects.find((o) => o.name === "Moon" || o.id === "moon");
  while (current && current.name !== "Earth" && current.name !== "SystemCenter") {
    cachedMoonChainNames.add(current.name);
    current = celestialModel.objects.find((o) => o.id === current.parentId);
  }
  return cachedMoonChainNames;
};

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
  const moonDisplayOrbitScale = useStore((s) => s.moonDisplayOrbitScale);
  
  const containerRef = useRef();
  const pivotRef = useRef();
  const orbitRef = useRef();
  const objRef = useRef();
  const cSphereRef = useRef();
  
  const isMoonChain = useMemo(() => getMoonChainNames().has(name), [name]);
  const effectiveOrbitScale = isMoonChain ? (moonDisplayOrbitScale ?? 39.2078) : orbitScale;

  if (!s) return null;
  
  let orbitRadius = s.orbitRadius;
  let orbitCenterx = s.orbitCenterx || 0;
  let orbitCentery = s.orbitCentery || 0;
  let orbitCenterz = s.orbitCenterz || 0;
  
  if (!actualPlanetSizes && effectiveOrbitScale) {
    orbitRadius = s.orbitRadius === 0 ? 0 : s.orbitRadius * effectiveOrbitScale;
    orbitCenterx = s.orbitCenterx === 0 ? 0 : s.orbitCenterx * effectiveOrbitScale;
    orbitCentery = s.orbitCentery === 0 ? 0 : s.orbitCentery * effectiveOrbitScale;
    orbitCenterz = s.orbitCenterz === 0 ? 0 : s.orbitCenterz * effectiveOrbitScale;
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