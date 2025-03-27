import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../store";

export default function EclipticGrid() {
  const eclipticGrid = useStore((s) => s.eclipticGrid);
  const eclipticGridSize = useStore((s) => s.eclipticGridSize);

  const gridHelper = useMemo(() => {
    // Create the grid helper
    const grid = new THREE.GridHelper(
      eclipticGridSize * 2,
      30,
      "#008800",
      "#000088"
    );

    // Attempt to make lines thicker (note: may not work in all browsers)
    grid.material.linewidth = 2;

    return grid;
  }, [eclipticGridSize]);

  if (!eclipticGrid) return null;

  return <primitive object={gridHelper} />;
}
