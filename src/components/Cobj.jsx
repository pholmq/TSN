import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { folder, useControls, button } from "leva";
import { useStore, useSettingsStore } from "../store";
import { Line } from "@react-three/drei";
import Planet from "./Planet";
import Orbit from "./Orbit";
import Deferent from "./Deferent";
import EclipticGrid from "./Helpers/EclipticGrid";
import createCircleTexture from "../utils/createCircleTexture";

// PERFORMANCE FIX: Hoist the red dot material outside the component
const circleTexture = createCircleTexture("red");
const spriteMaterial = new THREE.SpriteMaterial({
  map: circleTexture,
  transparent: true,
  opacity: 1,
  sizeAttenuation: false,
});

const Cobj = ({ name, children }) => {
  const { settings } = useSettingsStore();
  let s;
  let visible;
  let actualMoon = false;

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
  const orbitsLineWidth = useStore((s) => s.orbitsLineWidth);
  const editSettings = useStore((s) => s.editSettings);

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

  const hasDisplacement =
    orbitCentera !== 0 || orbitCenterb !== 0 || orbitCenterc !== 0;

  return (
    <>
      {hasDisplacement && visible && editSettings && (
        <group>
          <Line
            points={[
              [0, 0, 0],
              [orbitCentera, orbitCenterc, orbitCenterb],
            ]}
            color="yellow"
            lineWidth={orbitsLineWidth}
            dashed={false}
          />
          {/* NEW: Red dot precisely at the un-displaced origin */}
          <sprite
            position={[0, 0, 0]}
            material={spriteMaterial}
            scale={[0.002, 0.002, 0.002]}
          />
        </group>
      )}

      <group
        name="Container"
        ref={containerRef}
        position={[orbitCentera, orbitCenterc, orbitCenterb]}
        rotation-x={s.orbitTilta * (Math.PI / 180)}
        rotation-z={s.orbitTiltb * (Math.PI / 180)}
      >
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
            {s.type === "planet" ? (
              <Planet s={s} actualMoon={actualMoon} name={name} />
            ) : null}
            {s.name === "Earth" ? <EclipticGrid /> : null}
            {children}
          </group>
        </group>
      </group>
    </>
  );
};

export default Cobj;
