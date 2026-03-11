import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEphemeridesStore } from "./ephemeridesStore";
import { FaSave, FaExclamationTriangle } from "react-icons/fa";
import { speedFactOpts } from "../../utils/time-date-functions";

const EphemeridesResult = () => {
  const { showResult, generatedData, generationError, params, closeResult } =
    useEphemeridesStore();

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewText, setPreviewText] = useState("");

  // --- Formatting Logic ---
  const formatDataToText = (data, parameters) => {
    if (!data || !parameters) return "";

    const displayUnit = Object.keys(speedFactOpts).find(
      (key) => speedFactOpts[key] === parameters.stepFactor
    );

    let output = "--- EPHEMERIDES REPORT ---\n";
    output += `Generated on: ${new Date().toLocaleString()}\n`;
    output += `Start Date: ${parameters.startDate}\n`;
    output += `End Date: ${parameters.endDate}\n`;
    output += `Step Size: ${parameters.stepSize} ${displayUnit}\n`;
    output += "--------------------------------------\n\n";

    Object.keys(data).forEach((planetName) => {
      output += `PLANET: ${planetName.toUpperCase()}\n`;
      output += `${"Date".padEnd(12)} | ${"Time".padEnd(10)} | ${"RA".padEnd(
        12
      )} | ${"Dec".padEnd(12)} | ${"Dist".padEnd(12)} | ${"Elongation".padEnd(
        10
      )}\n`;
      output += "-".repeat(80) + "\n";

      data[planetName].forEach((row) => {
        output += `${row.date.padEnd(12)} | ${row.time.padEnd(
          10
        )} | ${row.ra.padEnd(12)} | ${row.dec.padEnd(12)} | ${row.dist.padEnd(
          12
        )} | ${row.elong}\n`;
      });
      output += "\n" + "=".repeat(80) + "\n\n";
    });

    return output;
  };

  useEffect(() => {
    if (generatedData && params) {
      setPreviewText(formatDataToText(generatedData, params));
    }
  }, [generatedData, params]);

  // --- Dragging Logic ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: position.x + (e.clientX - dragStart.x),
        y: position.y + (e.clientY - dragStart.y),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

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
    if (e.target.closest(".popup-header")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleSave = () => {
    if (!previewText || !params) return;
    const blob = new Blob([previewText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const safeStart = params.startDate.replace(/[:/]/g, "-");
    const safeEnd = params.endDate.replace(/[:/]/g, "-");
    const filename = `Ephemerides_${safeStart}_to_${safeEnd}.txt`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!showResult) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: `${30 + position.x}px`,
        transform: `translateY(calc(-50% + ${position.y}px))`,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        color: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        zIndex: 2147483647,
        width: "720px",
        maxWidth: "95vw",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #374151",
        userSelect: isDragging ? "none" : "auto",
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Header */}
      <div
        className="popup-header"
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          cursor: isDragging ? "grabbing" : "grab",
          borderBottom: "1px solid #374151",
          backgroundColor: "rgba(31, 41, 55, 0.95)",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {generationError ? (
            <FaExclamationTriangle
              style={{ color: "#f87171", fontSize: "20px" }}
            />
          ) : (
            <FaSave style={{ color: "#60a5fa", fontSize: "20px" }} />
          )}
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
            {generationError ? "Error" : "Ephemerides result"}
          </h2>
        </div>
        <button
          onClick={closeResult}
          style={{
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: "20px",
            padding: "5px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Content Body */}
      <div style={{ padding: "20px", overflowY: "auto", flexGrow: 1 }}>
        {generationError ? (
          <div style={{ padding: "10px", lineHeight: "1.6" }}>
            {/* <p
              style={{
                color: "#f87171",
                fontWeight: "bold",
                marginBottom: "15px",
                fontSize: "18px",
              }}
            >
              Calculation Stopped
            </p> */}
            <p style={{ whiteSpace: "pre-wrap", fontSize: "16px" }}>
              {generationError}
            </p>
          </div>
        ) : (
          <div
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <p
              style={{
                marginBottom: "10px",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              Click 'Save' to download as a text file.
            </p>
            <textarea
              readOnly
              value={previewText}
              style={{
                width: "100%",
                flexGrow: 1,
                minHeight: "400px",
                backgroundColor: "#000",
                color: "#10b981",
                fontFamily: "monospace",
                fontSize: "12px",
                padding: "10px",
                border: "1px solid #374151",
                borderRadius: "6px",
                resize: "none",
                whiteSpace: "pre",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: "15px 20px",
          borderTop: "1px solid #374151",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          backgroundColor: "rgba(31, 41, 55, 0.95)",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
        }}
      >
        {generationError ? (
          <button
            onClick={closeResult}
            style={{
              padding: "8px 24px",
              borderRadius: "6px",
              border: "1px solid #374151",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            OK
          </button>
        ) : (
          <>
            <button
              onClick={closeResult}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #374151",
                background: "transparent",
                color: "white",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaSave /> Save to File
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EphemeridesResult;
