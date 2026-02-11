import { useStore } from "../../store";
import { Html } from "@react-three/drei";
import { useRef, useMemo } from "react";
import starsData from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";

import { LABELED_STARS } from "../Stars/LabeledStars";

const CROSSHAIR_SIZE = 40; // px

export default function HighlightSelectedStar() {
  const position = useStore((s) => s.selectedStarPosition);
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const showLabels = useStore((s) => s.showLabels);

  // Get the selected star data and compute the display name
  const starName = useMemo(() => {
    if (!selectedStarHR) return null;

    // Handle Planets
    if (selectedStarHR.startsWith("Planet:")) {
      return selectedStarHR.replace("Planet:", "");
    }
    // Handle Special Stars without HR
    if (selectedStarHR.startsWith("Special:")) {
      return selectedStarHR.replace("Special:", "");
    }

    // Handle Stars (BSC or Special with HR)
    // Force toString() comparison for safety
    let star = starsData.find((s) => s.HR && String(s.HR) === selectedStarHR);
    if (!star) {
      // Try special stars if not in BSC
      star = specialStarsData.find(
        (s) => s.HR && String(s.HR) === selectedStarHR
      );
    }

    if (!star) return null;

    if (star.N && star.HIP) {
      return `${star.N} / HIP ${star.HIP}`;
    } else if (star.N && star.HR) {
      return `${star.N} / HR ${star.HR}`;
    } else if (star.HIP) {
      return `HIP ${star.HIP}`;
    } else if (star.HR) {
      return `HR ${star.HR}`;
    } else if (star.name) {
      return star.name;
    }
    return "Unknown";
  }, [selectedStarHR]);

  const isLabeledStar = useMemo(() => {
    if (!selectedStarHR) return false;

    // Always show crosshair for Planets
    if (selectedStarHR.startsWith("Planet:")) return true;

    // Find star data to check labeled list
    const star = starsData.find((s) => s.HR && String(s.HR) === selectedStarHR);
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
