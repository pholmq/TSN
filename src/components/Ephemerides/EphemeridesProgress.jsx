import React from "react";
import { createPortal } from "react-dom";
import { useEphemeridesStore } from "./ephemeridesStore";

const EphemeridesProgress = () => {
  const isGenerating = useEphemeridesStore((s) => s.isGenerating);
  const progress = useEphemeridesStore((s) => s.progress);
  const cancelGeneration = useEphemeridesStore((s) => s.cancelGeneration);

  if (!isGenerating) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "30px", // Distance from the bottom edge
        left: "50%", // Move to the horizontal center
        transform: "translateX(-50%)", // perfectly center the element
        width: "300px",
        backgroundColor: "rgba(31, 41, 55, 0.95)",
        borderRadius: "8px",
        border: "1px solid #374151",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
        padding: "15px",
        zIndex: 2147483648,
        color: "white",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
          Generating Ephemerides data
        </h3>
        <span
          style={{ fontSize: "14px", color: "#3b82f6", fontWeight: "bold" }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#1f2937",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "15px",
          border: "1px solid #4b5563",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "#3b82f6",
            transition: "width 0.1s linear",
          }}
        />
      </div>

      {/* Cancel Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={cancelGeneration}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            color: "#f87171",
            backgroundColor: "transparent",
            border: "1px solid #f87171",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
};

export default EphemeridesProgress;
