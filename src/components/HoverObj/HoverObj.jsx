import { useRef, useState, useMemo, useEffect } from "react";
import { useStore } from "../../store";
import HoverPanel from "./HoverPanel";
import createCircleTexture from "../../utils/createCircleTexture";
import { useThree } from "@react-three/fiber";

const HoverObj = ({ s, starColor = false }) => {
  // 1. Subscribe to the global store for visibility so only ONE panel can ever be open
  const hoveredObjectId = useStore((state) => state.hoveredObjectId);
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const setSearchTarget = useStore((state) => state.setSearchTarget);

  const [contextMenu, setContextMenu] = useState(false);
  const [pinned, setPinned] = useState(false);

  // Derived state: This object is active ONLY if its name matches the global store
  const isHovered = hoveredObjectId === s.name;

  const { gl } = useThree();
  const mouseDownRef = useRef(false);
  const timeoutRef = useRef(null);

  // Refs for custom double-tap logic
  const singleTapTimeout = useRef(null);
  const lastTap = useRef(0);

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

  // --- STATE CLEANUP INTERCEPTORS ---
  // When unpinning or closing menus, we must force the global hover state to clear,
  // otherwise the panel stays stuck open because the pointer left long ago.
  const handleSetPinned = (val) => {
    setPinned(val);
    if (!val) {
      setHoveredObjectId(null);
    }
  };

  const handleSetContextMenu = (val) => {
    setContextMenu(val);
    if (!val && !pinned) {
      setHoveredObjectId(null);
    }
  };

  // --- DESKTOP HOVER LOGIC ---
  const handlePointerOver = (e) => {
    if (useStore.getState().runIntro || mouseDownRef.current) return;

    // Ignore automatic "hover" on mobile. Touch devices rely entirely on taps.
    if (e.pointerType === "touch") return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!mouseDownRef.current && !useStore.getState().runIntro) {
        setHoveredObjectId(s.name);
      }
    }, 200);
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "touch") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!contextMenu && !pinned) {
      if (useStore.getState().hoveredObjectId === s.name) {
        setHoveredObjectId(null);
      }
    }
  };

  // const handleDoubleClick = () => {
  //   if (useStore.getState().planetCamera) {
  //     setSearchTarget(s.name);
  //   } else {
  //     setCameraTarget(s.name);
  //   }
  // };

  const handleDoubleClick = () => {
    // FIX: Always update the global camera target so the 3D Name/HIP label appears
    setCameraTarget(s.name);

    // If in Planet Camera, additionally trigger the local projection math
    if (useStore.getState().planetCamera) {
      setSearchTarget(s.name);
    }
  };

  // --- MOBILE TAP & DOUBLE-TAP LOGIC ---
  const handleClick = (e) => {
    if (useStore.getState().runIntro) return;
    e.stopPropagation(); // Prevent the click from hitting the background

    const now = Date.now();

    // If tapped twice within 300ms, execute double tap
    if (now - lastTap.current < 300) {
      clearTimeout(singleTapTimeout.current); // CANCEL the single tap!
      handleDoubleClick();
    } else {
      // Single tap (with a delay to ensure a second tap isn't coming)
      singleTapTimeout.current = setTimeout(() => {
        if (e.pointerType === "touch") {
          setHoveredObjectId(s.name); // Sets global state, automatically closing any other panels
        }
      }, 300);
    }

    lastTap.current = now;
  };

  // --- BACKGROUND CLICK LOGIC ---
  const handlePointerMissed = (e) => {
    // If the user clicks on nothing (background canvas), and THIS object is the active one, close it.
    if (
      e.pointerType === "touch" &&
      useStore.getState().hoveredObjectId === s.name
    ) {
      if (!pinned && !contextMenu) {
        setHoveredObjectId(null);
      }
    }
  };

  const size = 0.005;

  return (
    <sprite
      scale={[size, size, size]}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onPointerMissed={handlePointerMissed}
      onDoubleClick={handleDoubleClick} // Retain native desktop double-click support
      onContextMenu={() => {
        if (isHovered) setContextMenu(true);
      }}
      renderOrder={1}
    >
      <spriteMaterial
        map={circleTexture}
        transparent={true}
        opacity={isHovered ? 0.04 : 0.015}
        sizeAttenuation={false}
      />

      {(isHovered || contextMenu || pinned) && (
        <HoverPanel
          hovered={isHovered}
          contextMenu={contextMenu}
          setContextMenu={handleSetContextMenu} // Pass the interceptor
          pinned={pinned}
          setPinned={handleSetPinned} // Pass the interceptor
          s={s}
        />
      )}
    </sprite>
  );
};

export default HoverObj;
