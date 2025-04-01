import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

const PlanetCameraUI = () => {
  const showPositions = useStore((s) => s.showPositions);
  const planetCamera = useStore((s) => s.planetCamera);
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Memoize the planetFolders object to prevent recreation on every render
  const planetFolders = useMemo(() => {
    const folders = {};

    settings.forEach((s) => {
      if (s.traceable) {
        folders[s.name] = folder(
          {
            // Use unique keys for each control
            [`${s.name}ra`]: { label: "RA:", value: "", editable: false },
            [`${s.name}dec`]: { label: "Dec:", value: "", editable: false },
            [`${s.name}dist`]: { label: "Distance:", value: "", editable: false },
            [`${s.name}elongation`]: { label: "Elong.:", value: "", editable: false },
          },
          { collapsed: true }
        );
      }
    });

    folders.tip = {
      label: "Tip:",
      value: "Hover any planet to see its position",
      editable: false,
    };

    return folders;
  }, [settings]); // Only recreate if `settings` changes


  const plancamUIStore = useCreateStore();
const [, set] = useControls(() => ({
  Latitude: { value: 10 }
}), { store: plancamUIStore });
  // Create a custom Leva store

  // Set up Leva controls (only runs once)
  // const [, set] = useControls(() => planetFolders, { store: levaStore });

  // // Update Leva controls when `positions` change
  // useEffect(() => {
  //   for (const pos in positions) {
  //     set({
  //       [`${pos}ra`]: positions[pos].ra,
  //       [`${pos}dec`]: positions[pos].dec,
  //       [`${pos}dist`]: positions[pos].dist,
  //       [`${pos}elongation`]: positions[pos].elongation,
  //     });
  //   }
  // }, [positions, set]);

  return (
    <>
      {planetCamera && (
        <div className="plancam-div">
          <Leva
            store={plancamUIStore}
            titleBar={{ drag: true, title: "Planet camera", filter: false }}
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

export default PlanetCameraUI;