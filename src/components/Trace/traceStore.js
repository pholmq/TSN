import { create } from "zustand";
import { sDay } from "../../utils/time-date-functions.js";

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
