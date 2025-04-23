import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";
import {
  saveSettingsAsJson,
  loadSettingsFromFile,
} from "../../utils/saveAndLoadSettings";

const EditSettings = () => {
  const editSettings = useStore((s) => s.editSettings);
  const positions = usePosStore((s) => s.positions);
  const { settings, updateSetting, resetSettings } = useSettingsStore();

  const settingsFolders = useMemo(() => {
    const folders = {};

    settings.forEach((s) => {
      folders[s.name] = folder(
        {
          // Use unique keys for each control
          [`${s.name}size`]: {
            label: "size",
            value: "\u200B" + s.size, //Prifix with a whitespace to force string interpetations so that all decimals are there
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                size: cleanValue,
              });
            },
          },
          ...(s.actualSize !== undefined
            ? {
                [`${s.name}actualSize`]: {
                  label: "actualSize",
                  value: "\u200B" + s.actualSize,
                  editable: true,
                  onChange: (value) => {
                    const cleanValue = value.replace(/\u200B/g, "");
                    updateSetting({
                      ...s,
                      actualSize: cleanValue,
                    });
                  },
                },
              }
            : {}),

          [`${s.name}startPos`]: {
            label: "startPos",
            value: "\u200B" + s.startPos, //Prifix with a whitespace to force string interpetations so that all decimals are there
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                startPos: cleanValue,
              });
            },
          },
          [`${s.name}speed`]: {
            label: "speed",
            value: "\u200B" + s.speed,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                speed: cleanValue,
              });
            },
          },
          ...(s.rotationSpeed !== undefined
            ? {
                [`${s.name}rotationSpeed`]: {
                  label: "rotationSpeed",
                  value: "\u200B" + s.rotationSpeed,
                  editable: true,
                  onChange: (value) => {
                    const cleanValue = value.replace(/\u200B/g, "");
                    updateSetting({
                      ...s,
                      rotationSpeed: cleanValue,
                    });
                  },
                },
              }
            : {}),
          [`${s.name}tilt`]: {
            label: "tilt",
            value: "\u200B" + s.tilt,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                tilt: cleanValue,
              });
            },
          },
          ...(s.tiltb !== undefined
            ? {
                [`${s.name}tiltb`]: {
                  label: "tiltb",
                  value: "\u200B" + s.tiltb,
                  editable: true,
                  onChange: (value) => {
                    const cleanValue = value.replace(/\u200B/g, "");
                    updateSetting({
                      ...s,
                      tiltb: cleanValue,
                    });
                  },
                },
              }
            : {}),
          [`${s.name}orbitRadius`]: {
            label: "orbitRadius",
            value: "\u200B" + s.orbitRadius,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                orbitRadius: cleanValue,
              });
            },
          },
          [`${s.name}orbitCentera`]: {
            label: "orbitCentera",
            value: "\u200B" + s.orbitCentera,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                orbitCentera: cleanValue,
              });
            },
          },
          [`${s.name}orbitCenterb`]: {
            label: "orbitCenterb",
            value: "\u200B" + s.orbitCenterb,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                orbitCenterb: cleanValue,
              });
            },
          },
          [`${s.name}orbitCenterc`]: {
            label: "orbitCenterc",
            value: "\u200B" + s.orbitCenterc,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                orbitCenterc: cleanValue,
              });
            },
          },
          [`${s.name}orbitTilta`]: {
            label: "orbitTilta",
            value: "\u200B" + s.orbitTilta,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                orbitTilta: cleanValue,
              });
            },
          },
          [`${s.name}orbitTiltb`]: {
            label: "orbitTiltb",
            value: "\u200B" + s.orbitTiltb,
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              updateSetting({
                ...s,
                orbitTiltb: cleanValue,
              });
            },
          },
        },
        { collapsed: true }
      );
    });
    return {
      "Load settings": button(() => loadSettingsFromFile()),
      "Save settings": button(() => saveSettingsAsJson(settings)),
      "Reset settings": button(() => resetSettings()),

      ...folders,
    };
  }, [settings]); // Only recreate if `settings` changes

  // Create a custom Leva store
  const levaSettingsStore = useCreateStore();

  // Set up Leva controls (only runs once)
  const [, set] = useControls(() => settingsFolders, {
    store: levaSettingsStore,
  });

  // Synchronize Leva controls with store changes
  useEffect(() => {
    const updatedValues = {};
    settings.forEach((s) => {
      updatedValues[`${s.name}size`] = "\u200B" + s.size;
      if (s.actualSize !== undefined) {
        updatedValues[`${s.name}actualSize`] = "\u200B" + s.actualSize;
      }
      updatedValues[`${s.name}startPos`] = "\u200B" + s.startPos;
      updatedValues[`${s.name}speed`] = "\u200B" + s.speed;
      if (s.rotationSpeed !== undefined) {
        updatedValues[`${s.name}rotationSpeed`] = "\u200B" + s.rotationSpeed;
      }
      updatedValues[`${s.name}tilt`] = "\u200B" + s.tilt;
      if (s.tiltb !== undefined) {
        updatedValues[`${s.name}tiltb`] = "\u200B" + s.tiltb;
      }
      updatedValues[`${s.name}orbitRadius`] = "\u200B" + s.orbitRadius;
      updatedValues[`${s.name}orbitCentera`] = "\u200B" + s.orbitCentera;
      updatedValues[`${s.name}orbitCenterb`] = "\u200B" + s.orbitCenterb;
      updatedValues[`${s.name}orbitCenterc`] = "\u200B" + s.orbitCenterc;
      updatedValues[`${s.name}orbitTilta`] = "\u200B" + s.orbitTilta;
      updatedValues[`${s.name}orbitTiltb`] = "\u200B" + s.orbitTiltb;
    });
    set(updatedValues);
  }, [settings, set]);

  return (
    <>
      {editSettings && (
        <div className="settings-div">
          <Leva
            store={levaSettingsStore}
            titleBar={{ drag: true, title: "Settings", filter: false }}
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

export default EditSettings;