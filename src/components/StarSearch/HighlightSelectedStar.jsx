import { useStore } from "../../store";
import { Html } from "@react-three/drei";
import { useRef } from "react";

const CROSSHAIR_SIZE = 40; // px

export default function HighlightSelectedStar() {
  const position = useStore((s) => s.selectedStarPosition);
  const portalRef = useRef(document.body);

  if (!position) return null;

  return (
    <Html
      position={position}
      portal={{ current: document.body }}
      style={{ pointerEvents: "none" }}
      zIndexRange={[10, 0]}
    >
      <div
        style={{
          width: `${CROSSHAIR_SIZE}px`,
          height: `${CROSSHAIR_SIZE}px`,
          position: "absolute",
          top: "0",
          left: "0",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Top arm */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "4px", // thicker
            height: "30%", // shorter arm
            background: "yellow",
            transform: "translateX(-50%)",
          }}
        />
        {/* Bottom arm */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: "4px",
            height: "30%",
            background: "yellow",
            transform: "translateX(-50%)",
          }}
        />
        {/* Left arm */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            height: "4px",
            width: "30%",
            background: "yellow",
            transform: "translateY(-50%)",
          }}
        />
        {/* Right arm */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            height: "4px",
            width: "30%",
            background: "yellow",
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </Html>
  );
}
