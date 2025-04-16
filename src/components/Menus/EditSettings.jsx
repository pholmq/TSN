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
          [`${s.name}dist`]: {
            label: "Distance:",
            value: "",
            editable: false,
          },
          [`${s.name}elongation`]: {
            label: "Elong.:",
            value: "",
            editable: false,
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
        <div className="positions-div">
          <Leva
            store={levaSettingsStore}
            titleBar={{ drag: true, title: "Settings", filter: false }}
            fill={false}
            hideCopyButton
            theme={{
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
