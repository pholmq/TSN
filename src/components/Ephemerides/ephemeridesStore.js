import { create } from "zustand";

export const useEphemeridesStore = create((set, get) => ({
  trigger: false,
  params: null,
  isGenerating: false,
  showResult: false,
  generatedData: null,
  generatedBinaryDiagnostics: null,
  generationError: null,
  progress: 0,

  setGenerationParams: (params) =>
    set({
      trigger: true,
      params,
      showResult: false,
      generatedData: null,
      generatedBinaryDiagnostics: null,
      generationError: null,
      isGenerating: true,
      progress: 0,
    }),

  resetTrigger: () => set({ trigger: false }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setProgress: (progress) => set({ progress }),

  cancelGeneration: () =>
    set({
      isGenerating: false,
      progress: 0,
      trigger: false,
    }),

  setGeneratedData: (data, binaryDiagnostics = null) =>
    set({
      generatedData: data,
      generatedBinaryDiagnostics: binaryDiagnostics,
      showResult: true,
      generationError: null,
      isGenerating: false,
    }),

  setGenerationError: (error) =>
    set({
      generationError: error,
      showResult: true,
      generatedData: null,
      generatedBinaryDiagnostics: null,
      isGenerating: false,
    }),

  closeResult: () =>
    set({
      showResult: false,
      generatedData: null,
      generatedBinaryDiagnostics: null,
      generationError: null,
    }),
}));
