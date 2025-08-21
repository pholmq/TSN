import { useState, useEffect } from "react";
import { useStarDataStore } from "./starDataStore";
import starSettings from "../../settings/star-settings.json";
const starSettingsHRs = new Set(
  starSettings.map((s) => String(s.HR)).filter(Boolean)
);

const StarDataPanel = () => {
  const hoveredStar = useStarDataStore((state) => state.hoveredStar);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hoveredStar) return;

    // console.log(starSettingsHRs)

    const handleInitialPosition = (event) => {
      const root = document.getElementById("root");
      let scale = 1;

      if (root && root.style.transform) {
        const transformMatch = root.style.transform.match(/scale\(([^)]+)\)/);
        if (transformMatch) {
          scale = parseFloat(transformMatch[1]);
        }
      }

      const adjustedX = event.clientX / scale;
      const adjustedY = event.clientY / scale;

      setPanelPosition({ x: adjustedX - 70, y: adjustedY + 20 });

      document.removeEventListener("mousemove", handleInitialPosition);
    };

    document.addEventListener("mousemove", handleInitialPosition);

    // Delay fade-in until after position is set
    setTimeout(() => setVisible(true), 0);

    return () => {
      document.removeEventListener("mousemove", handleInitialPosition);
      setVisible(false);
    };
  }, [hoveredStar]);

  // Check if the star should be ignored
  if (hoveredStar && starSettingsHRs.has(String(hoveredStar.HR))) {
    return null;
  }

  // ✅ Always render, fade with opacity
  return (
    <div
      style={{
        position: "fixed",
        left: `${panelPosition.x}px`,
        top: `${panelPosition.y}px`,
        backgroundColor: "rgba(31, 41, 55, 0.8)",
        color: "#ffffff",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        maxWidth: "300px",
        pointerEvents: "none",
        opacity: visible ? 0.8 : 0,
        transition: "opacity 0.3s ease",
        display: hoveredStar ? "block" : "none",
      }}
    >
      <h3
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        {hoveredStar?.name}
      </h3>
      <p style={{ margin: "4px 0", whiteSpace: "nowrap", fontSize: "20px" }}>
        RA: {hoveredStar?.ra}
      </p>
      <p style={{ margin: "4px 0", fontSize: "20px" }}>
        Dec: {hoveredStar?.dec}
      </p>
      <p style={{ margin: "4px 0", fontSize: "20px" }}>
        Distance: {hoveredStar?.dist}
      </p>
      <p style={{ margin: "4px 0", fontSize: "20px" }}>
        Elongation: {hoveredStar?.elongation}
      </p>
      <p style={{ margin: "4px 0", fontSize: "20px" }}>
        Magnitude: {hoveredStar?.magnitude}
      </p>
    </div>
  );
};

export default StarDataPanel;
