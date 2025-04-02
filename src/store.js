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
  planetCameraTargetData: {},
  planetCameraHelper: true,
  planetCameraDirection: {
    camRotationy: 0,
    camRotationx: -0.2,
    camFov: 15,
    latRotationx: 0,
    longRotationy: 0,
    height: 0.43,
  },

  setPlanetCameraDirection: (updates) =>
    set((state) => ({
      planetCameraDirection: {
        ...state.planetCameraDirection,
        ...updates,
      },
    })),

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

  sunLight: 2,

  zodiac: false,
  setZodiac: (v) => set({ zodiac: v }),
  zodiacSize: 1,
  setZodiacSize: (v) => set({ zodiacSize: v }),
  zodiacSize: 1,
  setZodiacSize: (v) => set({ zodiacSize: v }),

  polarLine: false,
  setPolarLine: (v) => set({ polarLine: v }),
  southLine: false,
  setSouthLine: (v) => set({ southLine: v }),
  polarLineSize: 100,
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

  //Trigger update flags
  resetClicked: false,
  setResetClicked: () =>
    set((state) => ({ resetClicked: !state.resetClicked })),
  updAC: false, //When this value changes AnimationController rerenders
  updateAC: () => set((state) => ({ updAC: !state.updAC })),

  zoomLevel: 1,
  zoomIn: () => set((state) => ({ zoomLevel: state.zoomLevel + 0.1 })),
  zoomOut: () =>
    set((state) => ({ zoomLevel: Math.max(0.5, state.zoomLevel - 0.1) })),

  hoveredObjectId: null, // New state for tracking hovered object
  setHoveredObjectId: (id) => set({ hoveredObjectId: id }), // Action to update hovered object

  // starsRef: null, // Initialize the ref as null
  // setStarsRef: (ref) => set({ starsRef: ref }), // Function to update the ref
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
