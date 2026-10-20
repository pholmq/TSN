import { useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { folder, useControls, button } from "leva";
import { useStore, useSettingsStore } from "../store";
import { Line } from "@react-three/drei";
import Planet from "./Planet";
import Orbit from "./Orbit";
import Deferent from "./Deferent";
import EclipticGrid from "./Helpers/EclipticGrid";
import createCircleTexture from "../utils/createCircleTexture";
import usePlanetSpeed from "../utils/usePlanetSpeed";

// PERFORMANCE FIX: Hoist the red dot material outside the component
const circleTexture = createCircleTexture("red");
const spriteMaterial = new THREE.SpriteMaterial({
  map: circleTexture,
  transparent: true,
  opacity: 1,
  sizeAttenuation: false,
});

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

  // Initialize and update speeds silently into the object's userData
  usePlanetSpeed(name, s, orbitRadius, scene);

  return (
    <>
      {hasDisplacement && visible && editSettings && (
        <group>
          <Line
            points={[
              [0, 0, 0],
              [orbitCenterx, orbitCentery, orbitCenterz],
            ]}
            color="yellow"
            lineWidth={orbitsLineWidth}
            dashed={false}
            raycast={() => null}
            toneMapped={false}
          />
          {/* Red dot precisely at the un-displaced origin */}
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
        position={[orbitCenterx, orbitCentery, orbitCenterz]}
        rotation-x={(s.orbitTiltx || 0) * (Math.PI / 180)}
        rotation-y={(s.orbitTilty || 0) * (Math.PI / 180)}
        rotation-z={(s.orbitTiltz || 0) * (Math.PI / 180)}
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