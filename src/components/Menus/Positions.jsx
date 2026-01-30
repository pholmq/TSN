import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

const Positions = () => {
  const showPositions = useStore((s) => s.showPositions);
  const setShowPositions = useStore((s) => s.setShowPositions);
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Memoize the planetFolders object to prevent recreation on every render
  const planetFolders = useMemo(() => {
    const folders = {};

    settings.forEach((s) => {
      if (s.traceable) {
        folders[s.name] = folder(
          {
            [`${s.name}ra`]: { label: "RA:", value: "", editable: false },
            [`${s.name}dec`]: { label: "Dec:", value: "", editable: false },
            [`${s.name}dist`]: {
              label: "Distance:",
              value: "",
              editable: false,
            },
            [`${s.name}elongation`]: {
              label: "Elongation:",
              value: "",
              editable: false,
            },
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
  }, [settings]);

  // Create a custom Leva store
  const levaStore = useCreateStore();

  // Add Close button inside the panel
  useControls(
    {
      "Close Menu": button(() => setShowPositions(false)),
    },
    { store: levaStore }
  );

  // Set up Leva controls
  const [, set] = useControls(() => planetFolders, { store: levaStore });

  // Update Leva controls when `positions` change
  useEffect(() => {
    for (const pos in positions) {
      set({
        [`${pos}ra`]: positions[pos].ra,
        [`${pos}dec`]: positions[pos].dec,
        [`${pos}dist`]: positions[pos].dist,
        [`${pos}elongation`]: positions[pos].elongation,
      });
    }
  }, [JSON.stringify(positions), set]);

  if (!showPositions) return null;

  return createPortal(
    <div
      className="positions-div"
      style={{
        position: "fixed",
        top: "80px",
        right: "10px",
        zIndex: 2147483647,
        width: "280px", // Reduced width (was implicit or larger)
      }}
    >
      <Leva
        store={levaStore}
        titleBar={{ drag: true, title: "Positions", filter: false }}
        fill={false}
        hideCopyButton
        theme={{
          fontSizes: {
            root: "11px", // Reduced font size (was 16px)
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

export default Positions;
