/// src/components/EphemerisChecker/checkerStore.js
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

  visualPoints: [],
  setVisualPoints: (pts) => set({ visualPoints: pts }),

  plotSize: 6,
  setPlotSize: (v) => set({ plotSize: v }),

  showPlot: true,
  setShowPlot: (v) => set({ showPlot: v }),
}));

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

// Convert mixed units (km, ly, AU) back to pure AU for distance comparison
export function parseDistanceToAU(distStr) {
  if (!distStr || distStr.trim() === "-" || distStr.trim() === "") return 0;
  const val = parseFloat(distStr);
  if (isNaN(val)) return 0;
  if (distStr.includes("km")) return val / 149597871;
  if (distStr.includes("ly")) return val / 0.0000158125;
  return val; // Default AU
}

export function parseEphemerisText(text) {
  const lines = text.split("\n");
  const data = {};
  let currentPlanet = null;

  for (let line of lines) {
    const cleanLine = line.trim();

    if (cleanLine.startsWith("PLANET:")) {
      currentPlanet = cleanLine.replace("PLANET:", "").trim();
      currentPlanet =
        currentPlanet.charAt(0).toUpperCase() +
        currentPlanet.slice(1).toLowerCase();
      data[currentPlanet] = [];
    } else if (
      currentPlanet &&
      cleanLine.includes("|") &&
      !cleanLine.includes("Date")
    ) {
      const parts = cleanLine.split("|").map((s) => s.trim());
      if (parts.length >= 4) {
        data[currentPlanet].push({
          date: parts[0],
          time: parts[1],
          raStr: parts[2],
          decStr: parts[3],
          raDeg: raToDeg(parts[2]),
          decDeg: decToDeg(parts[3]),
          // Gracefully handle older files that might only have RA/Dec
          distAU: parts.length > 4 ? parseDistanceToAU(parts[4]) : null,
          elongDeg: parts.length > 5 ? parseFloat(parts[5]) || 0 : null,
        });
      }
    }
  }
  return data;
}
