import { create } from "zustand";

const emptyPosition = { x: 0, y: 0, z: 0 };

export const useObserverStore = create((set, get) => ({
  showObserver: false,
  setShowObserver: (value) => set({ showObserver: value }),
  traceObserver: false,
  // Enabling a trace should immediately provide a visible observer marker.
  // The trace itself grows only when the model time advances.
  setTraceObserver: (value) =>
    set((state) => ({
      traceObserver: value,
      showObserver: value ? true : state.showObserver,
    })),
  topocentric: false,
  setTopocentric: (value) => set({ topocentric: value }),
  latitude: 0,
  setLatitude: (value) =>
    set({ latitude: Math.max(-90, Math.min(90, Number(value) || 0)) }),
  longitude: 0,
  setLongitude: (value) => {
    const number = Number(value) || 0;
    set({ longitude: ((((number + 180) % 360) + 360) % 360) - 180 });
  },
  markerColor: "#00ffff",
  setMarkerColor: (value) => set({ markerColor: value }),
  traceColor: "#00ffff",
  setTraceColor: (value) => set({ traceColor: value }),
  earthOpacity: 1,
  setEarthOpacity: (value) =>
    set({ earthOpacity: Math.max(0, Math.min(1, Number(value))) }),
  currentGlobalPosition: emptyPosition,
  currentPositionTime: null,
  referenceGlobalPosition: null,
  referenceTime: null,
  seeds: [],
  nextSeedId: 1,
  displacementKm: 0,
  setCurrentGlobalPosition: (position, time = null) => {
    const reference = get().referenceGlobalPosition;
    const displacementKm = reference
      ? Math.hypot(
          position.x - reference.x,
          position.y - reference.y,
          position.z - reference.z
        )
      : 0;
    set({
      currentGlobalPosition: position,
      currentPositionTime: time,
      displacementKm,
    });
  },
  captureReference: (time = null) => {
    const current = get().currentGlobalPosition;
    set({
      referenceGlobalPosition: { ...current },
      referenceTime: time,
      displacementKm: 0,
    });
  },
  clearReference: () =>
    set({
      referenceGlobalPosition: null,
      referenceTime: null,
      displacementKm: 0,
    }),
  addSeed: (time = null) => {
    const { currentGlobalPosition, seeds, nextSeedId } = get();
    const seed = {
      id: nextSeedId,
      time,
      position: { ...currentGlobalPosition },
    };
    set({
      seeds: [...seeds, seed],
      nextSeedId: nextSeedId + 1,
    });
  },
  clearSeeds: () => set({ seeds: [] }),
}));
