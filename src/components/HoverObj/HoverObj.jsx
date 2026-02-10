import { useRef, useState, useMemo } from "react";
// Remove SpriteMaterial import, we will use the JSX element <spriteMaterial />
import { useStore } from "../../store";
import HoverPanel from "./HoverPanel";
import createCircleTexture from "../../utils/createCircleTexture";

const HoverObj = ({ s, starColor = false }) => {
  const [hovered, setHover] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);

  // Selectors
  const hoveredObjectId = useStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);
  const setCameraTarget = useStore((state) => state.setCameraTarget);

  const timeoutRef = useRef(null);

  const color = !starColor ? s.color : starColor;

  // FIX 1: Only create the texture ONCE when the color changes.
  const circleTexture = useMemo(() => {
    return createCircleTexture(color);
  }, [color]);

  const handlePointerOver = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setHover(true);
      setHoveredObjectId(s.name);
    }, 200);
  };

  const handlePointerLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHover(false);
    if (!contextMenu) {
      setHoveredObjectId(null);
    }
  };

  const showPanel = hovered && hoveredObjectId === s.name;
  const size = 0.005;

  return (
    <sprite
      scale={[size, size, size]}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={() => setCameraTarget(s.name)}
      onContextMenu={() => {
        if (showPanel) setContextMenu(true);
      }}
      renderOrder={1}
    >
      {/* FIX 2: Use declarative <spriteMaterial> instead of 'new SpriteMaterial()' */}
      {/* This allows R3F to update the opacity without destroying/recreating the material */}
      <spriteMaterial
        map={circleTexture}
        transparent={true}
        opacity={hovered ? 0.09 : 0.05}
        sizeAttenuation={false}
      />

      <HoverPanel
        hovered={showPanel}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        s={s}
      />
    </sprite>
  );
};

export default HoverObj;
