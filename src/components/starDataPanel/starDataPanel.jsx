// components/StarDataPanel.js
import { useState, useEffect } from "react";
import { useStarDataStore } from "./starDataStore";

const StarDataPanel = () => {
  const hoveredStar = useStarDataStore((state) => state.hoveredStar);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      // Get the root element's transform scale
      const root = document.getElementById("root");
      let scale = 1;

      if (root && root.style.transform) {
        const transformMatch = root.style.transform.match(/scale\(([^)]+)\)/);
        if (transformMatch) {
          scale = parseFloat(transformMatch[1]);
        }
      }

      // Adjust mouse coordinates for the root element's scale
      const adjustedX = event.clientX / scale;
      const adjustedY = event.clientY / scale;

      setMousePosition({ x: adjustedX, y: adjustedY });
    };

    if (hoveredStar) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [hoveredStar]);

  if (!hoveredStar) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${mousePosition.x - 70}px`,
        top: `${mousePosition.y + 20}px`, // 20px below cursor
        backgroundColor: "rgba(31, 41, 55, 0.8)", // Made transparent with 0.8 opacity
        color: "#ffffff",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        maxWidth: "300px",
        pointerEvents: "none", // Prevent interference with mouse events
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        {hoveredStar.name}
      </h3>
      <p style={{ margin: "4px 0", whiteSpace: "nowrap", fontSize: "16px" }}>
        RA: {hoveredStar.ra}
      </p>
      <p style={{ margin: "4px 0", fontSize: "16px" }}>
        Dec: {hoveredStar.dec}
      </p>
      <p style={{ margin: "4px 0", fontSize: "16px" }}>
        Magnitude: {hoveredStar.magnitude}
      </p>
      <p style={{ margin: "4px 0", fontSize: "16px" }}>
        Distance: {hoveredStar.dist}
      </p>
      {/* {JSON.stringify(hoveredStar.g, null, 2)} */}
    </div>
  );
};

export default StarDataPanel;
