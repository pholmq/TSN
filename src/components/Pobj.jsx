import { useRef, useEffect } from "react";
import { useStore, usePlotStore, useSettingsStore } from "../store";

const Pobj = ({ name, children }) => {
  const settings = useSettingsStore((s) => s.settings);
  const s = settings[settings.findIndex((p) => p.name === name)];
  const addPlotObj = usePlotStore((s) => s.addPlotObj);
  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes);

  const containerRef = useRef();
  const pivotRef = useRef();
  const orbitRef = useRef();
  const objRef = useRef();
  const cSphereRef = useRef();

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
  }, []);

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
                <mesh ref={objRef}>
                  <sphereGeometry args={[s.size, 128, 128]} />
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
