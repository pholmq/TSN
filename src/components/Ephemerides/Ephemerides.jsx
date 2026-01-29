import React, { useState } from "react";
import { useEphemeridesStore } from "./ephemeridesStore";
import {
  sDay,
  sYear,
  dateToDays,
  isValidDate,
  posToDate,
} from "../../utils/time-date-functions";

const Ephemerides = () => {
  const { setGenerationParams, isGenerating } = useEphemeridesStore();

  const [startDate, setStartDate] = useState(() => {
    // Default to today
    return new Intl.DateTimeFormat("sv-SE").format(Date.now());
  });

  const [endDate, setEndDate] = useState(() => {
    // Default to one year from now
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return new Intl.DateTimeFormat("sv-SE").format(d);
  });

  const [stepSize, setStepSize] = useState(10);
  const [stepFactor, setStepFactor] = useState(1); // 1 = Days, 365.25 = Years (approx)

  const [checkedPlanets, setCheckedPlanets] = useState(["Sun", "Mars"]); // Defaults

  const availablePlanets = [
    "Sun",
    "Mercury",
    "Venus",
    "Moon",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
  ];

  const handleCheckboxChange = (planet) => {
    if (checkedPlanets.includes(planet)) {
      setCheckedPlanets(checkedPlanets.filter((p) => p !== planet));
    } else {
      setCheckedPlanets([...checkedPlanets, planet]);
    }
  };

  const handleGenerate = () => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      alert("Invalid Date Format. Please use YYYY-MM-DD");
      return;
    }

    setGenerationParams({
      startDate,
      endDate,
      stepSize: Number(stepSize),
      stepFactor: Number(stepFactor),
      checkedPlanets,
    });
  };

  return (
    <div
      className="ephemerides-menu"
      style={{ color: "white", padding: "10px" }}
    >
      <h3>Ephemerides Generator</h3>

      <div style={{ marginBottom: "10px" }}>
        <label>Start Date:</label>
        <br />
        <input
          type="text"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            width: "100%",
            background: "#333",
            color: "white",
            border: "1px solid #555",
          }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>End Date:</label>
        <br />
        <input
          type="text"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            width: "100%",
            background: "#333",
            color: "white",
            border: "1px solid #555",
          }}
        />
      </div>

      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <label>Step:</label>
          <br />
          <input
            type="number"
            value={stepSize}
            onChange={(e) => setStepSize(e.target.value)}
            style={{
              width: "100%",
              background: "#333",
              color: "white",
              border: "1px solid #555",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Unit:</label>
          <br />
          <select
            value={stepFactor}
            onChange={(e) => setStepFactor(Number(e.target.value))}
            style={{
              width: "100%",
              background: "#333",
              color: "white",
              border: "1px solid #555",
            }}
          >
            <option value={1}>Days</option>
            <option value={sYear}>Years</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Planets:</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5px",
            marginTop: "5px",
          }}
        >
          {availablePlanets.map((p) => (
            <label
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "0.9em",
              }}
            >
              <input
                type="checkbox"
                checked={checkedPlanets.includes(p)}
                onChange={() => handleCheckboxChange(p)}
                style={{ marginRight: "5px" }}
              />
              {p}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating} // Disable when generating
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: isGenerating ? "#555" : "#2563eb", // Grey out if generating
          color: isGenerating ? "#ccc" : "white",
          border: "none",
          borderRadius: "6px",
          cursor: isGenerating ? "wait" : "pointer", // Change cursor
          fontWeight: "bold",
          transition: "background-color 0.2s",
        }}
      >
        {isGenerating ? "Generating..." : "Generate Ephemerides"}
      </button>
    </div>
  );
};

export default Ephemerides;
