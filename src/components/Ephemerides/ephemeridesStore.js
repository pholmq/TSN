import { create } from "zustand";

export const useEphemeridesStore = create((set) => ({
  trigger: false,
  params: null,

  // --- New Result State ---
  showResult: false,
  generatedData: null,
  generationError: null,

  // Actions
  setGenerationParams: (params) =>
    set({
      trigger: true,
      params,
      showResult: false,
      generatedData: null,
      generationError: null,
    }),

  resetTrigger: () => set({ trigger: false }),

  // Called by EphController when done
  setGeneratedData: (data) =>
    set({
      generatedData: data,
      showResult: true,
      generationError: null,
    }),

  // Called by EphController if limit exceeded
  setGenerationError: (error) =>
    set({
      generationError: error,
      showResult: true,
      generatedData: null,
    }),

  closeResult: () =>
    set({
      showResult: false,
      generatedData: null,
      generationError: null,
    }),
}));
