import { create } from "zustand";

export const useEphemeridesStore = create((set) => ({
  trigger: false,
  params: null,
  setGenerationParams: (params) => set({ trigger: true, params }),
  resetTrigger: () => set({ trigger: false }),
}));
