import { useLayoutEffect, useRef, useMemo } from "react";
import { Object3D } from "three";
import { useSettingsStore } from "../../store";

const PlotVisuals = ({ data }) => {
  const { settings } = useSettingsStore();

  // Helper to get planet settings (color, size)
  const getPlanetSetting = (name) => settings.find((s) => s.name === name);

  return (
    <group>
      {Object.entries(data).map(([planetName, positions]) => {
        const setting = getPlanetSetting(planetName);
        if (!setting || positions.length === 0) return null;

        return (
          <InstancedPlanet
            key={planetName}
            positions={positions}
            color={setting.color}
            size={setting.size} // You might want to adjust scale here
          />
        );
      })}
    </group>
  );
};

const InstancedPlanet = ({ positions, color, size }) => {
  const meshRef = useRef();
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    positions.forEach((posArray, i) => {
      dummy.position.set(posArray[0], posArray[1], posArray[2]);
      dummy.scale.set(1, 1, 1); // Keep scale 1, geometry controls size
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, positions.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        roughness={0.7}
        metalness={0.1}
      />
    </instancedMesh>
  );
};

export default PlotVisuals;
