import { create } from "zustand";

export const useEphemeridesStore = create((set) => ({
  trigger: false,
  params: null,

  // --- New State for UI Feedback ---
  isGenerating: false,
  // -------------------------------

  showResult: false,
  generatedData: null,
  generationError: null,

  setGenerationParams: (params) =>
    set({
      trigger: true,
      params,
      showResult: false,
      generatedData: null,
      generationError: null,
      // We can optimistically set this to true here so the button greys out instantly
      isGenerating: true,
    }),

  resetTrigger: () => set({ trigger: false }),

  // Action to toggle the loading state (called by Controller)
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setGeneratedData: (data) =>
    set({
      generatedData: data,
      showResult: true,
      generationError: null,
      isGenerating: false, // Stop generating when data is ready
    }),

  setGenerationError: (error) =>
    set({
      generationError: error,
      showResult: true,
      generatedData: null,
      isGenerating: false, // Stop generating on error
    }),

  closeResult: () =>
    set({
      showResult: false,
      generatedData: null,
      generationError: null,
    }),
}));
