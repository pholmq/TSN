import { useStore } from "../../store";
import { useMemo } from "react";
import createCrosshairTexture from "../../utils/createCrosshairTexture";

// Adjustable size in world units
const CROSSHAIR_SIZE = 0.02;

export default function HighlightSelectedStar() {
  const position = useStore((s) => s.selectedStarPosition);
  const texture = useMemo(() => createCrosshairTexture(), []);

  if (!position) return null;

  return (
    <sprite
      position={position}
      scale={[CROSSHAIR_SIZE, CROSSHAIR_SIZE, 1]}
      renderOrder={999}
    >
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        depthTest={true} // keep true for layering to work
        sizeAttenuation={false} // usually better in 3D
      />
    </sprite>
  );
}
