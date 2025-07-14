// store/starDataStore.js
import { create } from "zustand";

export const useStarDataStore = create((set) => ({
  hoveredStar: null,

  setHoveredStar: (starData) => set({ hoveredStar: starData }),
  clearHoveredStar: () => set({ hoveredStar: null }),
}));
