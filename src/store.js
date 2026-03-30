import { createRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultSpeedFact, sDay } from "./utils/time-date-functions.js";
import miscSettings from "./settings/misc-settings.json";
import celestialSettings from "./settings/celestial-settings.json";
import starSettings from "./settings/star-settings.json";

// Main simulation store using zustand
export const useStore = create(
  persist(
    (set) => ({
      posRef: createRef(),
      run: false,
      toggleRun: () => set((state) => ({ run: !state.run })),
      speedFact: getDefaultSpeedFact(),
      setSpeedFact: (v) => set({ speedFact: v }),
      speedMultiplier: 1,
      setSpeedMultiplier: (v) => set({ speedMultiplier: v }),
      showPositions: false,
      setShowPositions: (v) => set({ showPositions: v }),
      searchStars: true,
      setSearchStars: (v) => set({ searchStars: v }),
      activeCamera: "orbit",
      cameraTarget: "Earth",
      cameraUpdate: 0,
      setCameraTarget: (v) =>
        set((state) => ({
          cameraTarget: v,
          cameraUpdate: state.cameraUpdate + 1,
        })),
      searchTarget: null,
      searchUpdate: 0,
      setSearchTarget: (v) =>
        set((state) => ({
          searchTarget: v,
          searchUpdate: state.searchUpdate + 1,
        })),
      cameraFollow: false,
      setCameraFollow: (v) => set({ cameraFollow: v }),

      planetCamera: false,
      setPlanetCamera: (v) => set({ planetCamera: v }),

      planetCameraHelper: false,
      setPlanetCameraHelper: (v) => set({ planetCameraHelper: v }),

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

      showLevaMenu: true,
      toggleShowLevaMenu: () =>
        set((state) => ({ showLevaMenu: !state.showLevaMenu })),
      showMenu: true,
      toggleShowMenu: () => set((state) => ({ showMenu: !state.showMenu })),

      sunLight: 1,

      zodiac: false,
      setZodiac: (v) => set({ zodiac: v }),

      tropicalZodiac: false,
      setTropicalZodiac: (v) => set({ tropicalZodiac: v }),

      zodiacSize: 130,
      setZodiacSize: (v) => set({ zodiacSize: v }),

      polarLine: false,
      setPolarLine: (v) => set({ polarLine: v, southLine: v }),
      southLine: false,
      setSouthLine: (v) => set({ southLine: v }),
      polarLineSize: 15,
      setPolarLineSize: (v) => set({ polarLineSize: v }),

      celestialSphere: false,
      setCelestialSphere: (v) => set({ celestialSphere: v }),
      celestialSphereSize: 20000,
      setCelestialSphereSize: (v) => set({ celestialSphereSize: v }),

      eclipticGrid: false,
      setEclipticGrid: (v) => set({ eclipticGrid: v }),
      eclipticGridSize: 25000,
      setEclipticGridSize: (v) => set({ eclipticGridSize: v }),

      hScale: 50,
      sethScale: (v) => set({ hScale: v }),

      officialStarDistances: true,
      setOfficialStarDistances: (v) => set({ officialStarDistances: v }),

      showConstellations: false,
      setShowConstellations: (v) => set({ showConstellations: v }),

      starDistanceModifier: 42633,
      setStarDistanceModifier: (v) => set({ starDistanceModifier: v }),

      starScale: 1,
      setStarScale: (v) => set({ starScale: v }),

      BSCStars: true,
      setBSCStars: (v) => set({ BSCStars: v }),

      resetClicked: false,
      setResetClicked: () =>
        set((state) => ({ resetClicked: !state.resetClicked })),
      updAC: false,
      updateAC: () => set((state) => ({ updAC: !state.updAC })),

      zoomLevel: 60,
      setZoom: (level) => set({ zoomLevel: level }),
      zoomIn: () =>
        set((state) => ({
          zoomLevel: Math.min(state.zoomLevel + 10, 120),
        })),
      zoomOut: () =>
        set((state) => ({
          zoomLevel: Math.max(state.zoomLevel - 10, 60),
        })),

      hoveredObjectId: null,
      setHoveredObjectId: (id) => set({ hoveredObjectId: id }),

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
      setEphemerides: (v) => set({ ephimerides: v }),

      plot: false,
      setPlot: (v) => set({ plot: v }),

      selectedStarHR: null,
      setSelectedStarHR: (starHR) => set({ selectedStarHR: starHR }),

      selectedStarPosition: null,
      setSelectedStarPosition: (position) =>
        set({ selectedStarPosition: position }),

      selectedStarData: null,
      setSelectedStarData: (data) => set({ selectedStarData: data }),

      showHelp: false,
      setShowHelp: (v) => set({ showHelp: v }),

      showHelpOnStartup: true,
      setShowHelpOnStartup: (v) => set({ showHelpOnStartup: v }),

      labeledStarPositions: new Map(),
      setLabeledStarPosition: (hr, position, name) =>
        set((state) => {
          const newMap = new Map(state.labeledStarPositions);
          newMap.set(hr, { position, name });
          return { labeledStarPositions: newMap };
        }),

      cameraControlsRef: null,
      setCameraControlsRef: (ref) => set({ cameraControlsRef: ref }),

      cameraTransitioning: false,
      setCameraTransitioning: (transitioning) =>
        set({ cameraTransitioning: transitioning }),

      showRecorder: false,
      setShowRecorder: (v) => set({ showRecorder: v }),
    }),
    {
      name: "tsn-main-settings", // Name of the localStorage key
      partialize: (state) => ({
        showHelpOnStartup: state.showHelpOnStartup,
      }),
    }
  )
);

export const usePosStore = create((set) => ({
  trackedObjects: [],
  positions: {},
}));

export const usePlotStore = create((set, get) => ({
  plotObjects: [],

  addPlotObj: (newObj) =>
    set((state) => {
      const exists = state.plotObjects.some((obj) => obj.name === newObj.name);
      if (!exists) {
        return { plotObjects: [...state.plotObjects, newObj] };
      }
      return state;
    }),

  getPlotObj: (name) => get().plotObjects.find((p) => p.name === name),
}));

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
  tracedObjects: [],
}));

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
