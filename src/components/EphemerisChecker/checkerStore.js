import { create } from "zustand";

export const useCheckerStore = create((set) => ({
  showChecker: false,
  setShowChecker: (v) => set({ showChecker: v }),

  parsedData: null,
  setParsedData: (data) => set({ parsedData: data }),

  triggerCheck: false,
  setTriggerCheck: (v) => set({ triggerCheck: v }),

  isChecking: false,
  setIsChecking: (v) => set({ isChecking: v }),

  progress: 0,
  setProgress: (v) => set({ progress: v }),

  results: null,
  setResults: (res) => set({ results: res }),
}));

// Utility functions to convert string RA/Dec back to degrees for comparison
export function raToDeg(raStr) {
  const match = raStr.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);
  if (!match) return 0;
  return (
    (parseFloat(match[1]) +
      parseFloat(match[2]) / 60 +
      parseFloat(match[3]) / 3600) *
    15
  );
}

export function decToDeg(decStr) {
  const match = decStr.match(/([+-]?\d+)°\s*(\d+)'\s*([\d.]+)"/);
  if (!match) return 0;
  let d = parseFloat(match[1]);
  const m = parseFloat(match[2]);
  const s = parseFloat(match[3]);
  const sign = d < 0 || decStr.trim().startsWith("-") ? -1 : 1;
  return sign * (Math.abs(d) + m / 60 + s / 3600);
}

export function parseEphemerisText(text) {
  const lines = text.split("\n");
  const data = {};
  let currentPlanet = null;

  for (let line of lines) {
    if (line.startsWith("PLANET:")) {
      currentPlanet = line.replace("PLANET:", "").trim();
      currentPlanet =
        currentPlanet.charAt(0).toUpperCase() +
        currentPlanet.slice(1).toLowerCase();
      data[currentPlanet] = [];
    } else if (currentPlanet && line.includes("|") && !line.includes("Date")) {
      const parts = line.split("|").map((s) => s.trim());
      if (parts.length >= 4) {
        data[currentPlanet].push({
          date: parts[0],
          time: parts[1],
          raStr: parts[2],
          decStr: parts[3],
          raDeg: raToDeg(parts[2]),
          decDeg: decToDeg(parts[3]),
        });
      }
    }
  }
  return data;
}
