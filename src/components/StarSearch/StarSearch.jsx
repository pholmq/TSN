import React, { useState, useEffect, useMemo } from "react";
import starsData from "../../settings/BSC.json";
import { useStore } from "../../store";
import createCrosshairTexture from "../../utils/createCrosshairTexture";

export default function StarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarHR = useStore((s) => s.setSelectedStarHR);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const runIntro = useStore((s) => s.runIntro);

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

    if (lower.startsWith("hr ")) {
      const hrQuery = value.slice(3).trim();
      filtered = indexedStars.filter((star) => star.HR && star.HR === hrQuery);
    } else {
      const nameMatches = indexedStars.filter((star) =>
        star.N ? star.N.toLowerCase().includes(lower) : false
      );

      const hrDigits = value.replace(/\D/g, "");

      let hrMatches = [];

      if (lower === "hr") {
        hrMatches = indexedStars.filter(
          (star) => star.HR || (star.N && star.N.toLowerCase().includes("hr"))
        );
      } else if (hrDigits) {
        hrMatches = indexedStars.filter(
          (star) => star.HR && star.HR.includes(hrDigits)
        );
      }

      const all = [...nameMatches, ...hrMatches];
      const unique = Array.from(new Set(all));
      filtered = unique;
    }

    setResults(filtered);
  };

  const handleSelect = (star) => {
    setSelectedStarHR(star.HR);
    setQuery(star.N || star.HR_display);
    setResults([]);
  };

  // Derive star info from selectedStarHR
  const selectedStar = useMemo(() => {
    return selectedStarHR
      ? starsData.find((star) => star.HR?.toString() === selectedStarHR)
      : null;
  }, [selectedStarHR]);

  const hrHipString = useMemo(() => {
    if (!selectedStar) return "N/A";
    const hr = selectedStar.HR ? `HR ${selectedStar.HR}` : null;
    const hip = selectedStar.HIP ? `HIP ${selectedStar.HIP}` : null;
    return hr && hip ? `${hr} / ${hip}` : hr || hip || "N/A";
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
          // hidden: { !runIntro },
        }}
      >
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search stars by name or HR number"
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
          // For placeholder styling, you would need to use CSS for ::placeholder
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
            {results.map((star, index) => (
              <li
                key={index}
                onClick={() => handleSelect(star)}
                style={{
                  padding: "10px",
                  color: "#fff",
                  fontSize: "18px", // << bigger text
                  cursor: "pointer",
                  borderBottom: "1px solid #444",
                }}
              >
                {star.N
                  ? `${star.N} / ${star.HR_display || ""}`
                  : star.HR_display}
              </li>
            ))}
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
