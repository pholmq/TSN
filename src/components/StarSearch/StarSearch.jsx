import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import starsData from "../../settings/BSC.json";
import celestialData from "../../settings/celestial-settings.json";
import specialStarsData from "../../settings/star-settings.json";
import miscData from "../../settings/misc-settings.json";
import { useStore, useSettingsStore, useStarStore } from "../../store";
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

  const selectedStarData = useStore((s) => s.selectedStarData);

  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const runIntro = useStore((s) => s.runIntro);
  const cameraControlsRef = useStore((s) => s.cameraControlsRef);

  // --- Dragging State ---
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // --- Initialization & Cleanup ---
  useEffect(() => {
    // 1. If search is hidden (but component stays mounted), clear state
    if (!searchStars) {
      setQuery("");
      setResults([]);
      setSelectedStarHR(null);
    }

    // 2. If search is CLOSED (component unmounts), this cleanup runs guaranteed
    return () => {
      setSelectedStarHR(null);
    };
  }, [searchStars, setSelectedStarHR]); // Trigger on searchStars change or unmount

  useEffect(() => {
    setQuery("");
    setResults([]);
    setSelectedStarHR(null);
  }, [officialStarDistances, setSelectedStarHR]);

  // --- Search Logic ---
  const indexedObjects = useMemo(() => {
    // 1. Prepare Special Stars First
    const special = specialStarsData.map((star) => ({
      ...star,
      id: star.HR ? String(star.HR) : `Special:${star.name}`,
      type: "special",
      displayName: star.name,
      HR_display: star.HR ? `HR ${star.HR}` : null,
      N: star.name,
    }));

    const specialHRs = new Set(
      special.filter((s) => s.HR).map((s) => String(s.HR))
    );

    // 2. BSC Stars
    const bsc = starsData
      .filter((star) => {
        if (star.HR && specialHRs.has(String(star.HR))) {
          return false;
        }
        return true;
      })
      .map((star) => ({
        ...star,
        id: star.HR ? String(star.HR) : `HIP-${star.HIP}`,
        type: "star",
        HR_display: star.HR ? `HR ${star.HR}` : null,
        HIP_display: star.HIP ? `HIP ${star.HIP}` : null,
        displayName: star.N || (star.HR ? `HR ${star.HR}` : `HIP ${star.HIP}`),
      }));

    // 3. Planets
    const planets = celestialData
      .filter(
        (p) =>
          !p.name.includes("deferent") &&
          p.name !== "SystemCenter" &&
          !p.name.includes("def")
      )
      .map((p) => {
        const misc = miscData.find((m) => m.name === p.name);
        return {
          ...p,
          ...misc,
          id: `Planet:${p.name}`,
          type: "planet",
          displayName: p.name,
          N: p.name,
        };
      });

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
      const nameMatches = indexedObjects.filter((obj) =>
        obj.N ? obj.N.toLowerCase().includes(lower) : false
      );

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
      filtered = Array.from(
        new Map(all.map((item) => [item.id, item])).values()
      );
    }

    setResults(filtered.slice(0, 50));
  };

  const handleSelect = (obj) => {
    // Force visibility for Planets and Special Stars
    if (obj.type === "planet") {
      useSettingsStore
        .getState()
        .updateSetting({ name: obj.name, visible: true });
    } else if (obj.type === "special") {
      useStarStore.getState().updateSetting({ name: obj.name, visible: true });
    }

    setSelectedStarHR(obj.id);
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
      return selectedObject.displayName;
    }

    if (selectedObject.type === "special" && selectedObject.displayName) {
      return selectedObject.displayName;
    }

    if (selectedObject.N && selectedObject.HIP) {
      return `${selectedObject.N} / HIP ${selectedObject.HIP}`;
    } else if (selectedObject.N && selectedObject.HR) {
      return `${selectedObject.N} / HR ${selectedObject.HR}`;
    } else if (selectedObject.HIP) {
      return `HIP ${selectedObject.HIP}`;
    } else if (selectedObject.HR) {
      return `HR ${selectedObject.HR}`;
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
        left: `${30 + position.x}px`,
        width: "240px",
        backgroundColor: "#111827",
        opacity: 0.85,
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
                <div style={{ fontWeight: "normal" }}>
                  {displayString}
                  {selectedObject.type === "planet" &&
                    selectedObject.unicodeSymbol && (
                      <span
                        style={{ marginLeft: "6px" }}
                        dangerouslySetInnerHTML={{
                          __html: selectedObject.unicodeSymbol,
                        }}
                      />
                    )}
                </div>
              </div>
            </div>

            {selectedStarData && (
              <div
                style={{
                  marginTop: "12px",
                  borderTop: "1px solid #374151",
                  paddingTop: "10px",
                  fontSize: "12px",
                  color: "#d1d5db",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#9ca3af" }}>RA:</span>
                  <span style={{ textAlign: "right", maxWidth: "65%" }}>
                    {selectedStarData.ra}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#9ca3af" }}>Dec:</span>
                  <span style={{ textAlign: "right", maxWidth: "65%" }}>
                    {selectedStarData.dec}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#9ca3af" }}>Distance:</span>
                  <span>{selectedStarData.dist}</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#9ca3af" }}>Elongation:</span>
                  <span>{selectedStarData.elongation}</span>
                </div>
                {selectedStarData.mag !== "N/A" &&
                  selectedStarData.mag !== undefined && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#9ca3af" }}>Magnitude:</span>
                      <span>{selectedStarData.mag}</span>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
