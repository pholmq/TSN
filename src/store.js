import { createRef } from "react";
import { create } from "zustand";
import { getDefaultSpeedFact, sDay } from "./utils/time-date-functions.js";
import miscSettings from "./settings/misc-settings.json";
import celestialSettings from "./settings/celestial-settings.json";
import starSettings from "./settings/star-settings.json";

// Main simulation store using zustand
export const useStore = create((set) => ({
  posRef: createRef(),
  run: false,
  toggleRun: () => set((state) => ({ run: !state.run })),
  speedFact: getDefaultSpeedFact(),
  setSpeedFact: (v) => set({ speedFact: v }),
  speedMultiplier: 1,
  setSpeedMultiplier: (v) => set({ speedMultiplier: v }),
  showPositions: false,
  setShowPositions: (v) => set({ showPositions: v }),
  activeCamera: "orbit",
  cameraTarget: "Earth",
  cameraUpdate: 0, // Add a trigger value
  setCameraTarget: (v) =>
    set((state) => ({
      cameraTarget: v,
      cameraUpdate: state.cameraUpdate + 1,
    })),
  cameraFollow: false,
  setCameraFollow: (v) => set({ cameraFollow: v }),

  planetCamera: false,
  setPlanetCamera: (v) => set({ planetCamera: v }),
  planetCameraTarget: "Earth",
  setPlanetCameraTarget: (v) => {
    set({ planetCameraTarget: v });
  },
  planetCameraHelper: false,
  setPlanetCameraHelper: (v) => set({ planetCameraHelper: v }),
  planCamLat: 0,
  setPlanCamLat: (v) => set({ planCamLat: v }),
  planCamLong: 0,
  setPlanCamLong: (v) => set({ planCamLong: v }),
  planCamHeight: 6500,
  setPlanCamHeight: (v) => set({ planCamHeight: v }),
  planCamAngle: 0,
  setPlanCamAngle: (v) => set({ planCamAngle: v }),
  planCamDirection: 0,
  setPlanCamDirection: (v) => set({ planCamDirection: v }),
  planCamFov: 50,
  setPlanCamFov: (v) => set({ planCamFov: v }),
  planCamFar: 100,
  setPlanCamFar: (v) => set({ planCamFar: v }),

  orbits: true,
  setOrbits: (v) => set({ orbits: v }),
  orbitsLineWidth: 1.5,
  setOrbitsLineWidth: (v) => set({ orbitsLineWidth: v }),
  planetScale: 1,
  setPlanetScale: (v) => set({ planetScale: v }),
  actualPlanetSizes: false,
  setActualPlanetSizes: (v) => set({ actualPlanetSizes: v }),
  arrows: false,
  setArrows: (v) => set({ arrows: v }),
  arrowScale: 1,
  menuRight: false,
  showStats: false,
  showTexture: true,

  showLevaMenu: true,
  toggleShowLevaMenu: () =>
    set((state) => ({ showLevaMenu: !state.showLevaMenu })),
  showMenu: true,
  toggleShowMenu: () => set((state) => ({ showMenu: !state.showMenu })),

  sunLight: 2,

  zodiac: false,
  setZodiac: (v) => set({ zodiac: v }),
  zodiacSize: 1,
  setZodiacSize: (v) => set({ zodiacSize: v }),
  zodiacSize: 1,
  setZodiacSize: (v) => set({ zodiacSize: v }),

  polarLine: false,
  setPolarLine: (v) => set({ polarLine: v, southLine: v }),
  southLine: false,
  setSouthLine: (v) => set({ southLine: v }),
  polarLineSize: 15,
  setPolarLineSize: (v) => set({ polarLineSize: v }),

  celestialSphere: false,
  setCelestialSphere: (v) => set({ celestialSphere: v }),
  celestialSphereSize: 50,
  setCelestialSphereSize: (v) => set({ celestialSphereSize: v }),

  eclipticGrid: false,
  setEclipticGrid: (v) => set({ eclipticGrid: v }),
  eclipticGridSize: 100,
  setEclipticGridSize: (v) => set({ eclipticGridSize: v }),

  officialStarDistances: false,
  setOfficialStarDistances: (v) => set({ officialStarDistances: v }),

  // starDistanceModifier: 10,
  starDistanceModifier: 42633,
  setStarDistanceModifier: (v) => set({ starDistanceModifier: v }),

  starScale: 1,
  setStarScale: (v) => set({ starScale: v }),

  BSCStars: false,
  setBSCStars: (v) => set({ BSCStars: v }),

  //Trigger update flags
  resetClicked: false,
  setResetClicked: () =>
    set((state) => ({ resetClicked: !state.resetClicked })),
  updAC: false, //When this value changes AnimationController rerenders
  updateAC: () => set((state) => ({ updAC: !state.updAC })),

  zoomLevel: 80, // Initial zoom level
  setZoom: (level) => set({ zoomLevel: level }),
  zoomIn: () =>
    set((state) => ({
      zoomLevel: Math.min(state.zoomLevel + 10, 120),
    })),
  zoomOut: () =>
    set((state) => ({
      zoomLevel: Math.max(state.zoomLevel - 10, 60),
    })),

  hoveredObjectId: null, // New state for tracking hovered object
  setHoveredObjectId: (id) => set({ hoveredObjectId: id }), // Action to update hovered object

  endIntro: false,
  setEndIntro: (v) => set({ endIntro: v }),
  runIntro: true,
  setRunIntro: (v) => set({ runIntro: v }),

  editSettings: false,
  setEditSettings: (v) => set({ editSettings: v }),

  showLabels: true,
  setShowLables: (v) => set({ showLabels: v }),

  geoSphere: false,
  setGeoSphere: (v) => set({ geoSphere: v }),

  ephimerides: false,
  setEphimerides: (v) => set({ ephimerides: v }),
}));

export const usePosStore = create((set) => ({
  trackedObjects: [], //Populated in posController
  positions: {},
}));

// Plotobjects store
export const usePlotStore = create((set, get) => ({
  plotObjects: [],

  addPlotObj: (newObj) =>
    set((state) => {
      //Only add if it's a new object
      const exists = state.plotObjects.some((obj) => obj.name === newObj.name);
      if (!exists) {
        return { plotObjects: [...state.plotObjects, newObj] };
      }
      return state;
    }),

  getPlotObj: (name) => get().plotObjects.find((p) => p.name === name),
}));

// Trace-related store
export const useTraceStore = create((set) => ({
  trace: false,
  setTrace: (v) => set({ trace: v }),
  toggleTrace: () => set((state) => ({ trace: !state.trace })),
  interval: 10,
  lineWidth: 1.5,
  setLineWidth: (v) => set({ lineWidth: v }),
  lengthMultiplier: 1,
  setLengthMultiplier: (v) => set({ lengthMultiplier: v }),
  stepMultiplier: 1,
  setStepMultiplier: (v) => set({ stepMultiplier: v }),
  dotted: false,
  setDotted: (v) => set({ dotted: v }),
  traceStartPos: 0,
  setTraceStart: (v) => set({ traceStartPos: v }),
  stepFact: sDay,
  stepMultiplier: 1,
  tracedObjects: [],
}));

//Store with all celestial settings
export const useSettingsStore = create((set, get) => ({
  settings: celestialSettings.map((obj1) => {
    const [matchingObj] = miscSettings.filter(
      (obj2) => obj2.name === obj1.name
    );
    return { ...obj1, ...matchingObj };
  }),

  getSetting: (name) => get().settings.find((p) => p.name === name),

  updateSetting: (updatedObject) => {
    set((state) => {
      const newSettings = state.settings.map((item) =>
        item.name === updatedObject.name ? { ...item, ...updatedObject } : item
      );
      return { settings: newSettings };
    });
  },

  resetSettings: () =>
    set({
      settings: celestialSettings.map((obj1) => {
        const [matchingObj] = miscSettings.filter(
          (obj2) => obj2.name === obj1.name
        );
        return { ...obj1, ...matchingObj };
      }),
    }),
}));

//Store with stars
export const useStarStore = create((set, get) => ({
  settings: starSettings,
  getSetting: (name) => get().settings.find((p) => p.name === name),

  updateSetting: (updatedObject) => {
    set((state) => {
      const newSettings = state.settings.map((item) =>
        item.name === updatedObject.name ? { ...item, ...updatedObject } : item
      );
      return { settings: newSettings };
    });
  },
}));
