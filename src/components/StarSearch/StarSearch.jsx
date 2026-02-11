import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import starsData from "../../settings/BSC.json";
import celestialData from "../../settings/celestial-settings.json";
import specialStarsData from "../../settings/star-settings.json";
import { useStore } from "../../store";
import createCrosshairTexture from "../../utils/createCrosshairTexture";
import * as THREE from "three";
import { FaSearch } from "react-icons/fa";

export default function StarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // --- Store State ---
  const searchStars = useStore((s) => s.searchStars);

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
  const indexedObjects = useMemo(() => {
    // 1. BSC Stars
    const bsc = starsData.map((star) => ({
      ...star,
      id: star.HR ? String(star.HR) : `HIP-${star.HIP}`,
      type: "star",
      HR_display: star.HR ? `HR ${star.HR}` : null,
      HIP_display: star.HIP ? `HIP ${star.HIP}` : null,
      displayName: star.N || (star.HR ? `HR ${star.HR}` : `HIP ${star.HIP}`),
    }));

    // 2. Special Stars (from star-settings.json)
    const special = specialStarsData.map((star) => ({
      ...star,
      // If it has an HR number, use that as ID so it matches BSC logic, otherwise use Special prefix
      id: star.HR ? String(star.HR) : `Special:${star.name}`,
      type: "special",
      displayName: star.name,
      HR_display: star.HR ? `HR ${star.HR}` : null,
      N: star.name,
    }));

    // 3. Planets (from celestial-settings.json)
    const planets = celestialData
      .filter(
        (p) =>
          !p.name.includes("deferent") &&
          p.name !== "SystemCenter" &&
          !p.name.includes("def")
      )
      .map((p) => ({
        ...p,
        id: `Planet:${p.name}`,
        type: "planet",
        displayName: p.name,
        N: p.name,
      }));

    // Merge all (Planets + Special + BSC)
    return [...planets, ...special, ...bsc];
  }, []);

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
      filtered = indexedObjects.filter(
        (obj) => obj.HR && String(obj.HR) === hrQuery
      );
    } else if (lower.startsWith("hip ")) {
      const hipQuery = value.slice(4).trim();
      filtered = indexedObjects.filter(
        (obj) => obj.HIP && String(obj.HIP) === hipQuery
      );
    } else {
      // Search by Name
      const nameMatches = indexedObjects.filter((obj) =>
        obj.N ? obj.N.toLowerCase().includes(lower) : false
      );

      // Search by Number (HR or HIP)
      const digits = value.replace(/\D/g, "");
      let hrMatches = [];
      let hipMatches = [];

      if (lower === "hr") {
        hrMatches = indexedObjects.filter(
          (obj) => obj.HR || (obj.N && obj.N.toLowerCase().includes("hr"))
        );
      } else if (lower === "hip") {
        hipMatches = indexedObjects.filter(
          (obj) => obj.HIP || (obj.N && obj.N.toLowerCase().includes("hip"))
        );
      } else if (digits) {
        hrMatches = indexedObjects.filter(
          (obj) => obj.HR && String(obj.HR).includes(digits)
        );
        hipMatches = indexedObjects.filter(
          (obj) => obj.HIP && String(obj.HIP).includes(digits)
        );
      }

      const all = [...nameMatches, ...hrMatches, ...hipMatches];
      // Deduplicate by ID
      filtered = Array.from(
        new Map(all.map((item) => [item.id, item])).values()
      );
    }

    setResults(filtered.slice(0, 50));
  };

  const handleSelect = (obj) => {
    setSelectedStarHR(obj.id);

    // Determine display text for input box
    let displayText = obj.displayName;
    if (obj.type === "star" || (obj.type === "special" && obj.HR)) {
      if (obj.N && obj.HIP) {
        displayText = `${obj.N} / HIP ${obj.HIP}`;
      } else if (obj.N && obj.HR) {
        displayText = `${obj.N} / HR ${obj.HR}`;
      } else if (obj.HIP) {
        displayText = `HIP ${obj.HIP}`;
      } else if (obj.HR) {
        displayText = `HR ${obj.HR}`;
      }
    }

    setQuery(displayText);
    setResults([]);

    // Trigger camera move
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
  const selectedObject = useMemo(() => {
    return selectedStarHR
      ? indexedObjects.find((obj) => obj.id === selectedStarHR)
      : null;
  }, [selectedStarHR, indexedObjects]);

  const displayString = useMemo(() => {
    if (!selectedObject) return "N/A";

    if (selectedObject.type === "planet") {
      return "Planet";
    }

    // Stars & Special
    if (selectedObject.N && selectedObject.HIP) {
      return `${selectedObject.N} / HIP ${selectedObject.HIP}`;
    } else if (selectedObject.N && selectedObject.HR) {
      return `${selectedObject.N} / HR ${selectedObject.HR}`;
    } else if (selectedObject.HIP) {
      return `HIP ${selectedObject.HIP}`;
    } else if (selectedObject.HR) {
      return `HR ${selectedObject.HR}`;
    } else if (selectedObject.type === "special") {
      return selectedObject.displayName;
    }
    return "Unknown";
  }, [selectedObject]);

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
        left: `${250 + position.x}px`,
        width: "220px",
        backgroundColor: "#111827",
        opacity: 0.8,
        color: "white",
        borderRadius: "6px",
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        userSelect: isDragging ? "none" : "auto",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
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
          height: "28px",
          padding: "0 8px",
          cursor: isDragging ? "grab" : "default",
          backgroundColor: "#181c20",
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
            fontSize: "12px",
            fontWeight: "600",
            color: "white",
            pointerEvents: "none",
          }}
        >
          <FaSearch style={{ fontSize: "10px" }} />
          Search
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px" }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onClick={(e) => e.target.select()}
          placeholder="Search star or planet..."
          style={{
            fontSize: "12px",
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
            {results.map((obj, index) => {
              let displayText = obj.displayName;
              if (obj.type === "star" || (obj.type === "special" && obj.HR)) {
                const parts = [];
                if (obj.N) parts.push(obj.N);
                if (obj.HIP_display) parts.push(obj.HIP_display);
                if (obj.HR_display) parts.push(obj.HR_display);
                displayText = parts.length > 0 ? parts.join(" / ") : "Unknown";
              }

              return (
                <li
                  key={index}
                  onClick={() => handleSelect(obj)}
                  style={{
                    padding: "6px 10px",
                    color: "#d1d5db",
                    fontSize: "12px",
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

        {/* Selected Info */}
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
                <div style={{ fontWeight: "normal" }}>{displayString}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
