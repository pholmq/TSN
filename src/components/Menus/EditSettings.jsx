import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

const EditSettings = () => {
  const editSettings = useStore((s) => s.editSettings);
  const positions = usePosStore((s) => s.positions);
  const { settings, updateSetting } = useSettingsStore();

  const settingsFolders = useMemo(() => {
    const folders = {};

    settings.forEach((s) => {
      folders[s.name] = folder(
        {
          // Use unique keys for each control
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

    return folders;
  }, [settings]); // Only recreate if `settings` changes

  // Create a custom Leva store
  const levaSettingsStore = useCreateStore();

  // Set up Leva controls (only runs once)
  const [, set] = useControls(() => settingsFolders, {
    store: levaSettingsStore,
  });

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
