import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
          [`${s.name}visible`]: {
            label: "Show / Hide",
            value: s.visible,
            editable: true,
            onChange: (value) => {
              s.visible = value;
              updateSetting({
                ...s,
                visible: value,
              });
            },
          },
          [`${s.name}size`]: {
            label: "size",
            value: "\u200B" + s.size, //Prefix with a whitespace to force string interpetations so that all decimals are there
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              s.size = cleanValue;
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
                    s.actualSize = cleanValue;
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
            value: "\u200B" + s.startPos, //Prefix with a whitespace to force string interpetations so that all decimals are there
            editable: true,
            onChange: (value) => {
              const cleanValue = value.replace(/\u200B/g, "");
              s.startPos = cleanValue;
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
              s.speed = cleanValue;
              updateSetting({
                ...s,
                speed: cleanValue,
              });
            },
          },
          ...(s.rotationStart !== undefined
            ? {
                [`${s.name}rotationStart`]: {
                  label: "rotationStart",
                  value: "\u200B" + s.rotationStart,
                  editable: true,
                  onChange: (value) => {
                    const cleanValue = value.replace(/\u200B/g, "");
                    s.rotationStart = cleanValue;
                    updateSetting({
                      ...s,
                      rotationStart: cleanValue,
                    });
                  },
                },
              }
            : {}),
          ...(s.rotationSpeed !== undefined
            ? {
                [`${s.name}rotationSpeed`]: {
                  label: "rotationSpeed",
                  value: "\u200B" + s.rotationSpeed,
                  editable: true,
                  onChange: (value) => {
                    const cleanValue = value.replace(/\u200B/g, "");
                    s.rotationSpeed = cleanValue;
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
              s.tilt = cleanValue;
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
                    s.tiltb = cleanValue;
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
              s.orbitRadius = cleanValue;
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
              s.orbitCentera = cleanValue;
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
              s.orbitCenterb = cleanValue;
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
              s.orbitCenterc = cleanValue;
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
              s.orbitTilta = cleanValue;
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
              s.orbitTiltb = cleanValue;
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

  if (!editSettings) return null;

  return createPortal(
    <div
      className="settings-div"
      style={{
        position: "fixed",
        top: "80px",
        right: "10px",
        zIndex: 2147483647,
      }}
    >
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
    </div>,
    document.body
  );
};

export default EditSettings;
