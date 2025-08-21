import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../../store";

const Help = () => {
  const showHelp = useStore((s) => s.showHelp);
  const setShowHelp = useStore((s) => s.setShowHelp);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const helpRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition({
        x: position.x + deltaX,
        y: position.y + deltaY,
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const handleMouseDown = (e) => {
    // Only start dragging if clicking on the header area
    if (e.target.closest(".help-header")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  if (!showHelp) return null;

  return (
    <div
      ref={helpRef}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        color: "white",
        padding: "0",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        maxWidth: "600px",
        maxHeight: "80vh",
        overflow: "hidden",
        border: "1px solid #374151",
        userSelect: isDragging ? "none" : "auto",
      }}
    >
      <div
        className="help-header"
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 30px",
          cursor: isDragging ? "grabbing" : "grab",
          borderBottom: "1px solid #374151",
          backgroundColor: "rgba(17, 24, 39, 1)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
          The TYCHOSIUM Help
        </h2>
        <button
          onClick={() => setShowHelp(false)}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          padding: "30px",
          maxHeight: "calc(80vh - 80px)",
          overflow: "auto",
          lineHeight: "1.6",
          fontSize: "16px",
        }}
      >
        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{ color: "#60a5fa", marginBottom: "12px", fontSize: "18px" }}
          >
            🎮 Basic Controls
          </h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li>
              <strong>Mouse:</strong> Drag to rotate view, scroll to zoom
            </li>
            <li>
              <strong>Time Controls:</strong> Play/pause simulation, step
              forward/backward
            </li>
            <li>
              <strong>Date/Time:</strong> Set specific dates and times to
              observe
            </li>
            <li>
              <strong>Julian Day:</strong> Scientific time reference for precise
              positioning
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{ color: "#60a5fa", marginBottom: "12px", fontSize: "18px" }}
          >
            🌍 Planet Camera
          </h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li>
              <strong>Activate:</strong> Check "Planet camera" in Controls
            </li>
            <li>
              <strong>Navigate:</strong> Use arrow keys to move around the
              planet
            </li>
            <li>
              <strong>Position Controls:</strong> Check "Show planet camera
              position" to see controls panel
            </li>
            <li>
              <strong>Mouse:</strong> Drag to look around, scroll to zoom
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{ color: "#60a5fa", marginBottom: "12px", fontSize: "18px" }}
          >
            ⭐ Stars & Objects
          </h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li>
              <strong>Hover Stars:</strong> Hover over stars to see detailed
              information
            </li>
            <li>
              <strong>Search Stars:</strong> Use the search box (top-left) to
              find specific stars
            </li>
            <li>
              <strong>Planet Info:</strong> Check "Show positions" to see
              planetary coordinates
            </li>
            <li>
              <strong>Labels:</strong> Toggle "Show labels" to display object
              names
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{ color: "#60a5fa", marginBottom: "12px", fontSize: "18px" }}
          >
            🎯 Useful Features
          </h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li>
              <strong>Trace:</strong> Enable planetary orbit traces to see paths
            </li>
            <li>
              <strong>Camera Follow:</strong> Lock camera to follow a selected
              object
            </li>
            <li>
              <strong>Actual Planet Sizes:</strong> Toggle realistic vs. visible
              planet scaling
            </li>
            <li>
              <strong>Zodiac & Helpers:</strong> Show celestial reference
              systems
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{ color: "#60a5fa", marginBottom: "12px", fontSize: "18px" }}
          >
            ⚡ Keyboard Shortcuts
          </h3>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li>
              <strong>Arrow Keys:</strong> Navigate latitude/longitude in planet
              camera mode
            </li>
            <li>
              <strong>Shift + Arrows:</strong> Fine control (0.1° steps)
            </li>
            <li>
              <strong>Ctrl + Arrows:</strong> Coarse control (5° steps)
            </li>
            <li>
              <strong>Space:</strong> Play/pause time simulation
            </li>
          </ul>
        </section>

        <section>
          <h3
            style={{ color: "#60a5fa", marginBottom: "12px", fontSize: "18px" }}
          >
            📚 About TYCHOS
          </h3>
          <p style={{ margin: 0 }}>
            The TYCHOSIUM is an interactive 3D model based on the TYCHOS theory
            of our solar system. Explore celestial mechanics, planetary
            positions, and stellar observations from both Earth and planetary
            surfaces.
          </p>
          <p style={{ marginTop: "12px", marginBottom: 0 }}>
            <a
              href="https://www.tychos.space"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#60a5fa", textDecoration: "none" }}
            >
              Learn more at tychos.space →
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Help;
