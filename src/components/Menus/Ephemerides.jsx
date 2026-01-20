import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";
import {
  saveSettingsAsJson,
  loadSettingsFromFile,
} from "../../utils/saveAndLoadSettings";

const Ephemerides = () => {
  const ephimerides = useStore((s) => s.ephimerides);

  const { settings, updateSetting, resetSettings } = useSettingsStore();

  const checkboxes = {};
  settings.forEach((s) => {
    if (s.type === "planet" && s.name !== "Earth") {
      checkboxes[s.name] = {
        value: false,
        onChange: (v) => {
          //Create a copy and update the store. This will rerender all Cobj
          // const sCopy = { ...s };
          // sCopy.visible = v;
          // updateSetting(sCopy);
        },
      };
    }
  });

  const ephFolders = useMemo(() => {
    return {
      Create: button(() => saveSettingsAsJson(settings)),
      ...checkboxes,
    };
  }, []);

  // Create a custom Leva store
  const levaEphStore = useCreateStore();

  // Set up Leva controls (only runs once)
  const [, set] = useControls(() => ephFolders, {
    store: levaEphStore,
  });

  return (
    <>
      {ephimerides && (
        <div className="settings-div">
          <Leva
            store={levaEphStore}
            titleBar={{ drag: true, title: "Ephemerides", filter: false }}
            fill={false}
            hideCopyButton
            theme={{
              sizes: {
                // controlWidth: "50%", // Applies to ALL controls (text/number/color etc.)
                // labelWidth: "40%", // Adjust label width to balance space
              },

              fontSizes: {
                root: "16px",
              },
              fonts: {
                mono: "",
              },
              colors: {
                highlight1: "#FFFFFF",
                highlight2: "#FFFFFF",
              },
            }}
          />
        </div>
      )}
    </>
  );
};

export default Ephemerides;
