import { useStore } from "../../store";
import { Html } from "@react-three/drei";
import { useRef, useMemo } from "react";
import starsData from "../../settings/BSC.json";

import { LABELED_STARS } from "../Stars/LabeledStars";

const CROSSHAIR_SIZE = 40; // px

export default function HighlightSelectedStar() {
  const position = useStore((s) => s.selectedStarPosition);
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const showLabels = useStore((s) => s.showLabels);
  const portalRef = useRef(document.body);

  // Get the selected star data and compute the display name
  const starName = useMemo(() => {
    if (!selectedStarHR) return null;

    const star = starsData.find((s) => s.HR?.toString() === selectedStarHR);
    if (!star) return null;

    // Apply the same naming logic: Name + HIP, or just HIP, or just HR
    if (star.N && star.HIP) {
      return `${star.N} / HIP ${star.HIP}`;
    } else if (star.HIP) {
      return `HIP ${star.HIP}`;
    } else if (star.HR) {
      return `HR ${star.HR}`;
    }
    return "Unknown";
  }, [selectedStarHR]);

  const isLabeledStar = useMemo(() => {
    if (!selectedStarHR) return false;
    const star = starsData.find((s) => s.HR?.toString() === selectedStarHR);
    if (!star) return false;

    return LABELED_STARS.some(
      (query) =>
        (star.N && star.N.toLowerCase() === query.toLowerCase()) ||
        star.HIP === query ||
        star.HR === query
    );
  }, [selectedStarHR]);

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
        {/* Star name label above the crosshair */}
        {starName && !(showLabels && isLabeledStar) && (
          <div
            className="name-label"
            style={{
              position: "absolute",
              top: "-5px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <span>{starName}</span>
          </div>
        )}

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
