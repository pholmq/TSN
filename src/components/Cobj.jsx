import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { folder, useControls, button } from "leva";
import { useStore, useSettingsStore } from "../store";
import Planet from "./Planet";
import Orbit from "./Orbit";
import EclipticGrid from "./Helpers/EclipticGrid";

const Cobj = ({ name, children }) => {
  const { settings } = useSettingsStore();
  let s;
  let visible;
  let actualMoon = false;
  //Special hack for the Moon. We have an "actual" invisible moon since the "Non actual planet size" moon has the wrong
  // position so it can be visible
  if (name.startsWith("Actual ")) {
    actualMoon = true;
    visible = false;
    s = settings.find((p) => p.name === name.replace("Actual ", ""));
  } else {
    s = settings.find((p) => p.name === name);
    visible = s.visible;
  }

  const containerRef = useRef();
  const orbitRef = useRef();
  const pivotRef = useRef();

  const posRef = useStore((s) => s.posRef);
  const actualPlanetSizes = useStore((s) => s.actualPlanetSizes);
  useFrame(() => {
    orbitRef.current.rotation.y =
      s.speed * posRef.current - s.startPos * (Math.PI / 180);
  });

  let orbitRadius = s.orbitRadius;
  let orbitCentera = s.orbitCentera;
  let orbitCenterb = s.orbitCenterb;
  let orbitCenterc = s.orbitCenterc;
  if (!actualPlanetSizes && !actualMoon) {
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

  return (
    <>
      {/* <Pobj name={name}></Pobj> */}
      <group
        name="Container"
        ref={containerRef}
        position={[orbitCentera, orbitCenterc, orbitCenterb]}
        rotation-x={s.orbitTilta * (Math.PI / 180)}
        rotation-z={s.orbitTiltb * (Math.PI / 180)}
      >
        {orbitRadius ? (
          <group rotation-x={-Math.PI / 2}>
            <Orbit
              radius={orbitRadius}
              color={s.color}
              arrows={s.arrows}
              reverse={s.reverseArrows}
              deferent={s.type === "deferent" ? true : false}
              visible ={s.visible}
            />
          </group>
        ) : null}
        <group name="Orbit" ref={orbitRef}>
          <group name="Pivot" ref={pivotRef} position={[orbitRadius, 0, 0]}>
            {s.axesHelper && visible ? <axesHelper args={[10]} /> : null}
            {s.type === "planet" ? (
              <Planet s={s} actualMoon={actualMoon} name={name} />
            ) : null}
            {/* {s.type === "deferent" ? <Deferent s={s}/> */}
            {s.name === "Earth" ? <EclipticGrid /> : null}
            {children}
          </group>
        </group>
      </group>
    </>
  );
};

export default Cobj;
