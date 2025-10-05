import { create } from "zustand";

export const usePlanetCameraStore = create((set) => ({
  planetCameraTarget: "Earth",
  setPlanetCameraTarget: (v) => set({ planetCameraTarget: v }),

  planCamLat: 0,
  setPlanCamLat: (v) => set({ planCamLat: v }),

  planCamLong: 0,
  setPlanCamLong: (v) => set({ planCamLong: v }),

  planCamHeight: 6370,
  setPlanCamHeight: (v) => set({ planCamHeight: v }),

  planCamAngle: 0,
  setPlanCamAngle: (v) => set({ planCamAngle: v }),

  planCamDirection: 0,
  setPlanCamDirection: (v) => set({ planCamDirection: v }),

  planCamFov: 51,
  setPlanCamFov: (v) => set({ planCamFov: v }),

  planCamFar: 100,
  setPlanCamFar: (v) => set({ planCamFar: v }),

  showGround: true,
  setShowGround: (v) => set({ showGround: v }),

  groundSize: 154,

  groundHeight: 0,
}));
