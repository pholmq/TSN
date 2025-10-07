import React, { useState, useEffect, useMemo } from "react";
import starsData from "../../settings/BSC.json";
import { useStore } from "../../store";
import createCrosshairTexture from "../../utils/createCrosshairTexture";
import * as THREE from "three";

export default function StarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarHR = useStore((s) => s.setSelectedStarHR);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const runIntro = useStore((s) => s.runIntro);

  const cameraControlsRef = useStore((s) => s.cameraControlsRef);

  //setSelectedStarHR(null) on component mount
  useEffect(() => {
    setQuery("");
    setResults([]);
    setSelectedStarHR(null);
  }, []);

  // If officialStarDistances changes (toggles), clear the search field and results
  useEffect(() => {
    setQuery("");
    setResults([]);
    setSelectedStarHR(null);
  }, [officialStarDistances]);

  const indexedStars = starsData.map((star) => ({
    ...star,
    HR_display: star.HR ? `HR ${star.HR}` : null,
    HIP_display: star.HIP ? `HIP ${star.HIP}` : null,
  }));

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

    // Check for explicit HR number search (starts with "hr ")
    if (lower.startsWith("hr ")) {
      const hrQuery = value.slice(3).trim();
      filtered = indexedStars.filter((star) => star.HR && star.HR === hrQuery);
    }
    // Check for explicit HIP number search (starts with "hip ")
    else if (lower.startsWith("hip ")) {
      const hipQuery = value.slice(4).trim();
      filtered = indexedStars.filter(
        (star) => star.HIP && star.HIP === hipQuery
      );
    }
    // General search across name, HR, and HIP
    else {
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
      const unique = Array.from(new Set(all));
      filtered = unique;
    }

    setResults(filtered);
  };

  const handleSelect = (star) => {
    setSelectedStarHR(star.HR);
    let displayText;
    if (star.N && star.HIP) {
      displayText = `${star.N} / HIP ${star.HIP}`;
    } else if (star.HIP) {
      displayText = `HIP ${star.HIP}`;
    } else if (star.HR) {
      displayText = `HR ${star.HR}`;
    } else {
      displayText = "Unknown";
    }
    setQuery(displayText);
    setResults([]);

    // Rotate camera around target to view star
    setTimeout(() => {
      const starPos = useStore.getState().selectedStarPosition;
      if (!starPos || !cameraControlsRef?.current) return;

      const controls = cameraControlsRef.current;
      const target = new THREE.Vector3();
      controls.getTarget(target);

      const currentDist = controls.camera.position.distanceTo(target);

      // Direction from target to star
      const toStar = starPos.clone().sub(target).normalize();

      // Offset downward so star appears in upper part of screen
      const up = new THREE.Vector3(0, 1, 0);
      const offset = up.multiplyScalar(currentDist * 0.09); // Adjust 0.3 for more/less offset

      const newPos = target
        .clone()
        .add(toStar.multiplyScalar(currentDist))
        .sub(offset);

      controls.setPosition(newPos.x, newPos.y, newPos.z, true);
    }, 100);
  };

  // Derive star info from selectedStarHR
  const selectedStar = useMemo(() => {
    return selectedStarHR
      ? starsData.find((star) => star.HR?.toString() === selectedStarHR)
      : null;
  }, [selectedStarHR]);

  const hrHipString = useMemo(() => {
    if (!selectedStar) return "N/A";
    if (selectedStar.N && selectedStar.HIP) {
      return `${selectedStar.N} / HIP ${selectedStar.HIP}`;
    } else if (selectedStar.HIP) {
      return `HIP ${selectedStar.HIP}`;
    } else if (selectedStar.HR) {
      return `HR ${selectedStar.HR}`;
    }
    return "Unknown";
  }, [selectedStar]);

  // Create crosshair texture once
  const crosshairTexture = useMemo(() => createCrosshairTexture(), []);
  const crosshairImageSrc = crosshairTexture.image.toDataURL(); // Convert to base64 src

  return (
    !runIntro && (
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          width: "310px",
          opacity: 0.8,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onClick={(e) => e.target.select()}
          placeholder="Search stars by name/number"
          style={{
            fontSize: "18px",
            color: "#ffffff",
            backgroundColor: "#374151",
            borderRadius: "0.25rem",
            padding: "0.5rem",
            border: "none",
            outline: "none",
            flexGrow: 1,
            width: "100%",
            boxSizing: "border-box",
          }}
          className="starSearch-input"
        />

        {results.length > 0 && (
          <ul
            style={{
              width: "100%",
              backgroundColor: "#1f2937",
              borderRadius: "0 0 8px 8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              maxHeight: "200px",
              overflowY: "auto",
              marginTop: "4px",
              listStyle: "none",
              padding: 0,
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
                    padding: "10px",
                    color: "#fff",
                    fontSize: "18px",
                    cursor: "pointer",
                    borderBottom: "1px solid #444",
                  }}
                >
                  {displayText}
                </li>
              );
            })}
          </ul>
        )}
        {/* Selected star info */}
        {selectedStarHR && (
          <div
            style={{
              marginTop: "10px",
              backgroundColor: "#1f2937",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={crosshairImageSrc}
                alt="Crosshair"
                style={{
                  width: "40px",
                  height: "40px",
                  filter: "brightness(2.5) drop-shadow(0 0 6px yellow)",
                  flexShrink: 0,
                }}
              />
              <strong>{hrHipString}</strong>
            </div>
          </div>
        )}
      </div>
    )
  );
}
