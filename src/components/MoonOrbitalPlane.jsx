import { Children, useRef, useEffect, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useStore, usePlotStore, useSettingsStore } from "../store";

const D2R = Math.PI / 180;
const DISPLAY_MOON_SCALE = 39.2078; // Same distance scale as Cobj and Pobj.
const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Match Cobj's order: centre offset, orbital tilt, rotation, orbital radius.
// Body tilt/size affect the editor's axis marker, not the child orbit.
const OrbitalFrame = ({
  settings,
  orbitRef,
  distanceScale,
  guides,
  children,
}) => {
  const centre = [
    number(settings.orbitCentera) * distanceScale,
    number(settings.orbitCenterc) * distanceScale,
    number(settings.orbitCenterb) * distanceScale,
  ];
  const radius = number(settings.orbitRadius) * distanceScale;
  const size = Math.abs(number(settings.size));
  const circle = useMemo(
    () =>
      Array.from({ length: 129 }, (_, i) => {
        const angle = (i / 128) * Math.PI * 2;
        return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
      }),
    [radius]
  );

  return (
    <group>
      {guides && centre.some((v) => v !== 0) && (
        <Line
          points={[[0, 0, 0], centre]}
          color="yellow"
          raycast={() => null}
          toneMapped={false}
        />
      )}
      <group
        position={centre}
        rotation-x={number(settings.orbitTilta) * D2R}
        rotation-z={number(settings.orbitTiltb) * D2R}
      >
        <group ref={orbitRef}>
          {guides && radius !== 0 && (
            <group>
              <Line
                points={circle}
                color="white"
                raycast={() => null}
                toneMapped={false}
              />
              <Line
                points={[
                  [0, 0, 0],
                  [radius, 0, 0],
                ]}
                color="white"
                raycast={() => null}
                toneMapped={false}
              />
            </group>
          )}
          <group position={[radius, 0, 0]}>
            {guides && size > 0 && (
              <group
                rotation={[
                  number(settings.tiltb) * D2R,
                  0,
                  number(settings.tilt) * D2R,
                ]}
              >
                <axesHelper args={[size]} raycast={() => null} />
              </group>
            )}
            {children}
          </group>
        </group>
      </group>
    </group>
  );
};

const LunarBranch = ({
  children,
  node,
  plane,
  live,
  distanceScale,
  guides,
}) => {
  const outerRef = useRef();
  const planeRef = useRef();
  const innerRef = useRef();
  const posRef = useStore((state) => state.posRef);
  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);
  const nodeSpeed = number(node.speed);
  const nodeStart = number(node.startPos);
  const planeSpeed = number(plane.speed);
  const planeStart = number(plane.startPos);

  useEffect(() => {
    // Only the export/trace model belongs in the plot registry.
    if (live) return;

    // Outer rotation: +Omega(t)
    addPlotObj({
      name: "Moon Node Outer",
      speed: nodeSpeed,
      startPos: nodeStart,
      orbitRef: outerRef,
    });

    addPlotObj({
      name: "Moon Plane",
      speed: planeSpeed,
      startPos: planeStart,
      orbitRef: planeRef,
    });

    // Inner counter-rotation: -Omega(t)
    addPlotObj({
      name: "Moon Node Inner",
      speed: -nodeSpeed,
      startPos: -nodeStart,
      orbitRef: innerRef,
    });

    return () => {
      removePlotObj("Moon Node Outer");
      removePlotObj("Moon Plane");
      removePlotObj("Moon Node Inner");
    };
  }, [
    live,
    nodeSpeed,
    nodeStart,
    planeSpeed,
    planeStart,
    addPlotObj,
    removePlotObj,
  ]);

  useFrame(() => {
    if (!live || !outerRef.current || !planeRef.current || !innerRef.current)
      return;

    // Follow the displayed time, independently of export/trace time stepping.
    const time = posRef.current ?? 0;
    const angle = nodeSpeed * time - nodeStart * D2R;
    outerRef.current.rotation.y = angle;
    planeRef.current.rotation.y = planeSpeed * time - planeStart * D2R;
    innerRef.current.rotation.y = -angle;
  });

  return (
    <OrbitalFrame
      settings={node}
      orbitRef={outerRef}
      distanceScale={distanceScale}
      guides={guides}
    >
      <OrbitalFrame
        settings={plane}
        orbitRef={planeRef}
        distanceScale={distanceScale}
        guides={guides}
      >
        <group ref={innerRef}>{children}</group>
      </OrbitalFrame>
    </OrbitalFrame>
  );
};

const MoonOrbitalPlane = ({ children, live = false }) => {
  const node = useSettingsStore(
    useCallback(
      (state) => state.settings.find((p) => p.name === "Moon Node"),
      []
    )
  );
  const plane = useSettingsStore(
    useCallback(
      (state) => state.settings.find((p) => p.name === "Moon Plane"),
      []
    )
  );
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const editSettings = useStore((state) => state.editSettings);
  if (!node || !plane) return null;

  const distanceScale = actualPlanetSizes ? 1 : DISPLAY_MOON_SCALE;
  if (!live) {
    return (
      <LunarBranch
        node={node}
        plane={plane}
        live={false}
        distanceScale={distanceScale}
      >
        {children}
      </LunarBranch>
    );
  }

  // The displayed Moon is enlarged; the hidden Actual Moon supplies physical
  // coordinates. Scale offsets independently, without scaling either body's mesh.
  return Children.map(children, (child) => {
    if (!child) return null;
    const physical = child.props.name?.startsWith("Actual ");
    return (
      <LunarBranch
        node={node}
        plane={plane}
        live
        distanceScale={physical ? 1 : distanceScale}
        guides={editSettings && !physical}
      >
        {child}
      </LunarBranch>
    );
  });
};

export default MoonOrbitalPlane;
