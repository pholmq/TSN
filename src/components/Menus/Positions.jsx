import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

const Positions = () => {
  const showPositions = useStore((s) => s.showPositions);
  const setShowPositions = useStore((s) => s.setShowPositions);
  const showSpeeds = useStore((s) => s.showSpeeds); // Get Show speeds state
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Memoize the planetFolders object to prevent recreation on every render
  const planetFolders = useMemo(() => {
    const folders = {};

    settings.forEach((s) => {
      if (s.traceable) {
        let controls = {
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
        };

        // Conditionally add speed fields
        if (showSpeeds) {
          controls[`${s.name}orbSpeed`] = {
            label: "Orbital speed:",
            value: "",
            editable: false,
          };
          controls[`${s.name}absSpeed`] = {
            label: "Absolute speed:",
            value: "",
            editable: false,
          };
          controls[`${s.name}avgAbsSpeed`] = {
            label: "Avg abs speed:",
            value: "",
            editable: false,
          };
        }

        folders[s.name] = folder(controls, { collapsed: true });
      }
    });

    folders.tip = {
      label: "Tip:",
      value: "Hover any planet to see its position",
      editable: false,
    };

    return folders;
  }, [settings, showSpeeds]);

  // Create a custom Leva store
  const levaStore = useCreateStore();

  // Highly targeted DOM injection for the X button
  useEffect(() => {
    if (!showPositions) return;

    const interval = setInterval(() => {
      // Find the deepest div containing ONLY the exact title text
      const textDiv = Array.from(document.querySelectorAll("div")).find(
        (el) =>
          el.textContent.trim() === "Positions" && el.children.length === 0
      );

      if (textDiv) {
        // Leva's title bar is the immediate flex container wrapping this text
        const titleBar = textDiv.parentElement;

        if (titleBar && !titleBar.querySelector(".leva-close-x")) {
          // Allow the title bar to anchor our absolutely positioned button
          titleBar.style.position = "relative";

          const closeBtn = document.createElement("div");
          closeBtn.className = "leva-close-x";
          closeBtn.innerHTML = "✕";

          // Style it seamlessly into the top right corner
          Object.assign(closeBtn.style, {
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#8C92A4",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "4px",
            zIndex: "9999",
          });

          // Native hover colors
          closeBtn.onmouseenter = () => (closeBtn.style.color = "#FFFFFF");
          closeBtn.onmouseleave = () => (closeBtn.style.color = "#8C92A4");

          // CRITICAL: Stop the click from passing through and triggering Leva's drag feature
          closeBtn.onmousedown = (e) => e.stopPropagation();

          // Close action
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowPositions(false);
          };

          titleBar.appendChild(closeBtn);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [showPositions, setShowPositions]);

  // Set up Leva controls for planets (re-init when planetFolders updates via `showSpeeds` change)
  const [, set] = useControls(() => planetFolders, { store: levaStore }, [
    planetFolders,
  ]);

  // Update Leva controls when `positions` change
  useEffect(() => {
    const formatSpeed = (speedKmS) => {
      if (speedKmS == null) return "";
      if (speedKmS < 1) {
        return `${(speedKmS * 3600).toFixed(2)} km/h`;
      }
      return `${speedKmS.toFixed(2)} km/s`;
    };

    for (const pos in positions) {
      const updateData = {
        [`${pos}ra`]: positions[pos].ra,
        [`${pos}dec`]: positions[pos].dec,
        [`${pos}dist`]: positions[pos].dist,
        [`${pos}elongation`]: positions[pos].elongation,
      };

      if (showSpeeds && positions[pos].speeds) {
        updateData[`${pos}orbSpeed`] = formatSpeed(
          positions[pos].speeds.orbital
        );
        updateData[`${pos}absSpeed`] = formatSpeed(
          positions[pos].speeds.absolute
        );
        updateData[`${pos}avgAbsSpeed`] = formatSpeed(
          positions[pos].speeds.avgAbsolute
        );
      }

      set(updateData);
    }
  }, [JSON.stringify(positions), set, showSpeeds]);

  if (!showPositions) return null;

  return createPortal(
    <div
      className="positions-div"
      style={{
        position: "fixed",
        top: "80px",
        right: "10px",
        zIndex: 2147483647,
      }}
    >
      <Leva
        store={levaStore}
        titleBar={{ drag: true, title: "Positions", filter: false }}
        fill={false}
        hideCopyButton
        theme={{
          fontSizes: {
            root: "12px",
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
