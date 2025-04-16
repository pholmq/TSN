import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

const EditSettings = () => {
  const editSettings = useStore((s) => s.editSettings);
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Memoize the planetFolders object to prevent recreation on every render
  const planetFolders = useMemo(() => {
    const folders = {};

    settings.forEach((s) => {
        folders[s.name] = folder(
          {
            // Use unique keys for each control
            [`${s.name}ra`]: { label: "RA:", value: "", editable: false },
            [`${s.name}dec`]: { label: "Dec:", value: "", editable: false },
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

    // folders.tip = {
    //   label: "Tip:",
    //   value: "Hover any planet to see its position",
    //   editable: false,
    // };

    return folders;
  }, [settings]); // Only recreate if `settings` changes

  // Create a custom Leva store
  const levaStore = useCreateStore();

  // Set up Leva controls (only runs once)
  const [, set] = useControls(() => planetFolders, { store: levaStore });

  // Update Leva controls when `positions` change
//   useEffect(() => {
//     for (const pos in positions) {
//       set({
//         [`${pos}ra`]: positions[pos].ra,
//         [`${pos}dec`]: positions[pos].dec,
//         [`${pos}dist`]: positions[pos].dist,
//         [`${pos}elongation`]: positions[pos].elongation,
//       });
//     }
//   }, [positions, set]);

  return (
    <>
      {editSettings && (
        <div className="positions-div">
          <Leva
            store={levaStore}
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
