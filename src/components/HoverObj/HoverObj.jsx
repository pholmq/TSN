import { useRef, useState, useMemo, useEffect } from "react";
// Remove SpriteMaterial import, we will use the JSX element <spriteMaterial />
import { useStore } from "../../store";
import HoverPanel from "./HoverPanel";
import createCircleTexture from "../../utils/createCircleTexture";
import { useThree } from "@react-three/fiber"; // 1. Import useThree

const HoverObj = ({ s, starColor = false }) => {
  const [hovered, setHover] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);

  // Selectors
  const hoveredObjectId = useStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const runIntro = useStore((state) => state.runIntro); // Get runIntro state

  const { gl } = useThree(); // Get gl to access domElement
  const mouseDownRef = useRef(false); // Track mouse state

  const timeoutRef = useRef(null);

  const color = !starColor ? s.color : starColor;

  // FIX 1: Only create the texture ONCE when the color changes.
  const circleTexture = useMemo(() => {
    return createCircleTexture(color);
  }, [color]);

  // Setup mouse listeners to track dragging
  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseDown = () => {
      mouseDownRef.current = true;
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, [gl]);

  const handlePointerOver = () => {
    // Abort if intro is running OR mouse is held down (dragging)
    if (runIntro || mouseDownRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Double check state before activating
      if (!mouseDownRef.current && !runIntro) {
        setHover(true);
        setHoveredObjectId(s.name);
      }
    }, 200);
  };

  const handlePointerLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHover(false);
    if (!contextMenu) {
      // Only clear if WE are the one currently hovered
      // (This prevents clearing if the user moved quickly to another object)
      // Although purely based on this component, we can just check our local state
      if (hoveredObjectId === s.name) {
        setHoveredObjectId(null);
      }
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
        // Reduced opacity to make planets visible through the marker
        opacity={hovered ? 0.04 : 0.015}
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
