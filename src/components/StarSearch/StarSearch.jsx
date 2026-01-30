import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import starsData from "../../settings/BSC.json";
import { useStore } from "../../store";
import createCrosshairTexture from "../../utils/createCrosshairTexture";
import * as THREE from "three";
import { FaSearch, FaTimes } from "react-icons/fa";

export default function StarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // --- Store State ---
  const searchStars = useStore((s) => s.searchStars);
  const setSearchStars = useStore((s) => s.setSearchStars);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarHR = useStore((s) => s.setSelectedStarHR);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const runIntro = useStore((s) => s.runIntro);
  const cameraControlsRef = useStore((s) => s.cameraControlsRef);

  // --- Dragging State ---
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // --- Initialization & Cleanup ---
  useEffect(() => {
    if (!searchStars) {
      setQuery("");
      setResults([]);
    }
  }, [searchStars]);

  useEffect(() => {
    setQuery("");
    setResults([]);
    setSelectedStarHR(null);
  }, [officialStarDistances]);

  // --- Search Logic ---
  const indexedStars = useMemo(
    () =>
      starsData.map((star) => ({
        ...star,
        HR_display: star.HR ? `HR ${star.HR}` : null,
        HIP_display: star.HIP ? `HIP ${star.HIP}` : null,
      })),
    []
  );

  const handleChange = (e) => {
    const value = e.target.value.trim();
    setQuery(value);

    if (value === "") {
      setResults([]);
      setSelectedStarHR(null);
      return;
    }

    const lower = value.toLowerCase();
    let filtered = [];

    if (lower.startsWith("hr ")) {
      const hrQuery = value.slice(3).trim();
      filtered = indexedStars.filter((star) => star.HR && star.HR === hrQuery);
    } else if (lower.startsWith("hip ")) {
      const hipQuery = value.slice(4).trim();
      filtered = indexedStars.filter(
        (star) => star.HIP && star.HIP === hipQuery
      );
    } else {
      const nameMatches = indexedStars.filter((star) =>
        star.N ? star.N.toLowerCase().includes(lower) : false
      );

      const digits = value.replace(/\D/g, "");
      let hrMatches = [];
      let hipMatches = [];

      if (lower === "hr") {
        hrMatches = indexedStars.filter(
          (star) => star.HR || (star.N && star.N.toLowerCase().includes("hr"))
        );
      } else if (lower === "hip") {
        hipMatches = indexedStars.filter(
          (star) => star.HIP || (star.N && star.N.toLowerCase().includes("hip"))
        );
      } else if (digits) {
        hrMatches = indexedStars.filter(
          (star) => star.HR && star.HR.includes(digits)
        );
        hipMatches = indexedStars.filter(
          (star) => star.HIP && star.HIP.includes(digits)
        );
      }

      const all = [...nameMatches, ...hrMatches, ...hipMatches];
      filtered = Array.from(new Set(all));
    }

    setResults(filtered.slice(0, 50));
  };

  const handleSelect = (star) => {
    setSelectedStarHR(star.HR);
    let displayText;
    if (star.N && star.HIP) {
      displayText = `${star.N} / HIP ${star.HIP}`;
    } else if (star.N && star.HR) {
      displayText = `${star.N} / HR ${star.HR}`;
    } else if (star.HIP) {
      displayText = `HIP ${star.HIP}`;
    } else if (star.HR) {
      displayText = `HR ${star.HR}`;
    } else {
      displayText = "Unknown";
    }
    setQuery(displayText);
    setResults([]);

    setTimeout(() => {
      const starPos = useStore.getState().selectedStarPosition;
      if (!starPos || !cameraControlsRef?.current) return;

      const controls = cameraControlsRef.current;
      const target = new THREE.Vector3();
      controls.getTarget(target);

      const currentDist = controls.camera.position.distanceTo(target);
      const starToTarget = target.clone().sub(starPos).normalize();
      const basePos = target
        .clone()
        .add(starToTarget.multiplyScalar(currentDist));

      const up = new THREE.Vector3(0, 1, 0);
      const offset = up.multiplyScalar(currentDist * -0.07);
      const newPos = basePos.sub(offset);

      controls.setPosition(newPos.x, newPos.y, newPos.z, true);
    }, 100);
  };

  // --- Display Helpers ---
  const selectedStar = useMemo(() => {
    return selectedStarHR
      ? starsData.find((star) => star.HR?.toString() === selectedStarHR)
      : null;
  }, [selectedStarHR]);

  const hrHipString = useMemo(() => {
    if (!selectedStar) return "N/A";
    if (selectedStar.N && selectedStar.HIP) {
      return `${selectedStar.N} / HIP ${selectedStar.HIP}`;
    } else if (selectedStar.N && selectedStar.HR) {
      return `${selectedStar.N} / HR ${selectedStar.HR}`;
    } else if (selectedStar.HIP) {
      return `HIP ${selectedStar.HIP}`;
    } else if (selectedStar.HR) {
      return `HR ${selectedStar.HR}`;
    }
    return "Unknown";
  }, [selectedStar]);

  const crosshairImageSrc = useMemo(
    () => createCrosshairTexture().image.toDataURL(),
    []
  );

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

  if (runIntro || !searchStars) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: `${30 + position.y}px`,
        left: `${20 + position.x}px`,
        width: "220px",
        backgroundColor: "#111827",
        opacity: 0.8,
        color: "white",
        borderRadius: "6px", // Matched rounded corners
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        userSelect: isDragging ? "none" : "auto",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header - Matches Leva / Positions Style */}
      <div
        className="popup-header"
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "28px", // Slim height
          padding: "0 8px",
          cursor: isDragging ? "grab" : "default",
          backgroundColor: "#181c20", // Darker header (Leva style)
          borderBottom: "1px solid #181c20",
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "15px",
            fontWeight: "600",
            // textTransform: "uppercase",
            color: "white", // Light gray text
            pointerEvents: "none",
          }}
        >
          <FaSearch style={{ fontSize: "10px" }} />
          Star Search
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px" }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onClick={(e) => e.target.select()}
          placeholder="Search name/number..."
          style={{
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor: "#374151",
            borderRadius: "4px",
            padding: "6px 10px",
            border: "none",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            marginBottom: results.length > 0 || selectedStarHR ? "8px" : "0",
          }}
          className="starSearch-input"
        />

        {/* Results List */}
        {results.length > 0 && (
          <ul
            style={{
              width: "100%",
              backgroundColor: "#1f2937",
              borderRadius: "4px",
              maxHeight: "180px",
              overflowY: "auto",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {results.map((star, index) => {
              const parts = [];
              if (star.N) parts.push(star.N);
              if (star.HIP_display) parts.push(star.HIP_display);
              if (star.HR_display) parts.push(star.HR_display);
              const displayText =
                parts.length > 0 ? parts.join(" / ") : "Unknown";

              return (
                <li
                  key={index}
                  onClick={() => handleSelect(star)}
                  style={{
                    padding: "6px 10px",
                    color: "#d1d5db",
                    fontSize: "13px",
                    cursor: "pointer",
                    borderBottom:
                      index < results.length - 1 ? "1px solid #374151" : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#374151")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {displayText}
                </li>
              );
            })}
          </ul>
        )}

        {/* Selected Star Info */}
        {selectedStarHR && (
          <div
            style={{
              marginTop: "8px",
              backgroundColor: "#1f2937",
              color: "white",
              padding: "10px",
              borderRadius: "4px",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={crosshairImageSrc}
                alt="Crosshair"
                style={{
                  width: "28px",
                  height: "28px",
                  filter: "brightness(2.5) drop-shadow(0 0 4px yellow)",
                  flexShrink: 0,
                }}
              />
              <div>
                <span
                  style={{
                    color: "#9ca3af",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  SELECTED
                </span>
                <div style={{ fontWeight: "normal" }}>{hrHipString}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
