import { useRef, useState } from "react";
import {SpriteMaterial} from "three";
import { useStore } from "../../store"; 
import HoverPanel from "./HoverPanel"; // Relative import
import createCircleTexture from "../../utils/createCircleTexture"; // Adjust path if utils/ is elsewhere

const HoverObj = ({ s, starColor=false }) => {
  const [hovered, setHover] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);
  const hoveredObjectId = useStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const timeoutRef = useRef(null);
  const color = !starColor ? s.color : starColor
  const circleTexture = createCircleTexture(color);

  const spriteMaterial = new SpriteMaterial({
    map: circleTexture,
    transparent: true,
    opacity: hovered ? 0.09 : 0.05,
    sizeAttenuation: false,
    depthTest: false,
  });

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
      material={spriteMaterial}
      scale={[size, size, size]}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={() => setCameraTarget(s.name)}
      onContextMenu={() => {
        if (hovered) setContextMenu(true);
      }}
      renderOrder={1}
    >
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
