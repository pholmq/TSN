import { useRef, useState, useMemo, useEffect } from "react";
import { useStore } from "../../store";
import HoverPanel from "./HoverPanel";
import createCircleTexture from "../../utils/createCircleTexture";
import { useThree } from "@react-three/fiber";

const HoverObj = ({ s, starColor = false }) => {
  const [hovered, setHover] = useState(false);
  const [contextMenu, setContextMenu] = useState(false);
  const [pinned, setPinned] = useState(false); // Lifted state

  // OPTIMIZATION: Removed all reactive Zustand subscriptions.
  // We only grab the setter functions, which never trigger re-renders.
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const setSearchTarget = useStore((state) => state.setSearchTarget);

  const { gl } = useThree();
  const mouseDownRef = useRef(false);
  const timeoutRef = useRef(null);

  const color = !starColor ? s.color : starColor;

  const circleTexture = useMemo(() => {
    return createCircleTexture(color);
  }, [color]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onMouseDown = () => (mouseDownRef.current = true);
    const onMouseUp = () => (mouseDownRef.current = false);

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
    };
  }, [gl]);

  const handlePointerOver = () => {
    if (useStore.getState().runIntro || mouseDownRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!mouseDownRef.current && !useStore.getState().runIntro) {
        setHover(true);
        setHoveredObjectId(s.name);
      }
    }, 200);
  };

  const handlePointerLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHover(false);

    if (!contextMenu && !pinned) {
      // Only clear global state if not pinned/in menu
      if (useStore.getState().hoveredObjectId === s.name) {
        setHoveredObjectId(null);
      }
    }
  };

  const handleDoubleClick = () => {
    if (useStore.getState().planetCamera) {
      setSearchTarget(s.name);
    } else {
      setCameraTarget(s.name);
    }
  };

  const size = 0.005;

  return (
    <sprite
      scale={[size, size, size]}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={handleDoubleClick}
      onContextMenu={() => {
        if (hovered) setContextMenu(true);
      }}
      renderOrder={1}
    >
      <spriteMaterial
        map={circleTexture}
        transparent={true}
        opacity={hovered ? 0.04 : 0.015}
        sizeAttenuation={false}
      />

      {/* Keeps DOM mounted if mouse is on it, menu is open, OR it is pinned */}
      {(hovered || contextMenu || pinned) && (
        <HoverPanel
          hovered={hovered}
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          pinned={pinned}
          setPinned={setPinned}
          s={s}
        />
      )}
    </sprite>
  );
};

export default HoverObj;
