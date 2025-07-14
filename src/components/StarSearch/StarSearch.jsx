import React, { useState } from "react";
import starsData from "../../settings/BSC.json";

export default function StarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const indexedStars = starsData.map((star) => ({
    ...star,
    HR_display: star.HR ? `HR ${star.HR}` : null,
  }));

  const handleChange = (e) => {
    const value = e.target.value.trim();
    setQuery(value);

    if (value === "") {
      setResults([]);
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
    console.log("Selected star:", star);
    setQuery(star.N || star.HR_display);
    setResults([]);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 1000,
        width: "300px",
        opacity: 0.8,
      }}
    >
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search by star name or HR number"
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
    </div>
  );
}
