import create from "zustand";
import bscSettings from "../../settings/BSC.json";

export const useBSCStore = create((set, get) => {
  // Convert JSON array to Map for O(1) lookups by name
  const settingsMap = new Map(bscSettings.map((setting) => [setting.n, setting]));

  return {
    settings: settingsMap,
    getSetting: (name) => get().settings.get(name),
    updateSetting: (updatedObject) =>
      set((state) => {
        const newSettings = new Map(state.settings);
        newSettings.set(updatedObject.n, {
          ...newSettings.get(updatedObject.n),
          ...updatedObject,
        });
        return { settings: newSettings };
      }),
  };
});