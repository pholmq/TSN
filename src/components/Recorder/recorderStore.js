import { create } from "zustand";

export const useRecorderStore = create((set) => ({
  command: null,
  setCommand: (cmd) => set({ command: cmd }),

  status: "Ready",
  setStatus: (status) => set({ status }),

  progress: 0,
  setProgress: (p) => set({ progress: p }),

  errorMsg: "",
  setErrorMsg: (msg) => set({ errorMsg: msg }),

  duration: 10,
  setDuration: (v) => set({ duration: v }),

  sizePreset: "2x",
  setSizePreset: (v) => set({ sizePreset: v }),
}));
