import { create } from "zustand";

export const usePlotterStore = create((set) => ({
  trigger: false,
  params: null,

  isGenerating: false,

  showResult: false,
  generatedData: null, // Will hold { PlanetName: [Vector3, Vector3...] }
  generationError: null,

  setGenerationParams: (params) =>
    set({
      trigger: true,
      params,
      showResult: false,
      generatedData: null,
      generationError: null,
      isGenerating: true,
    }),

  resetTrigger: () => set({ trigger: false }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setGeneratedData: (data) =>
    set({
      generatedData: data,
      showResult: true,
      generationError: null,
      isGenerating: false,
    }),

  setGenerationError: (error) =>
    set({
      generationError: error,
      showResult: true,
      generatedData: null,
      isGenerating: false,
    }),

  clearResults: () =>
    set({
      showResult: false,
      generatedData: null,
      generationError: null,
    }),
}));
