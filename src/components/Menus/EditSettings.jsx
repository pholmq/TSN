import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";
import {
  saveSettingsAsJson,
  loadSettingsFromFile,
} from "../../utils/saveAndLoadSettings";

const getControls = (s, updateSetting) => ({
  [`${s.name}size`]: {
    label: "size",
    value: "\u200B" + s.size,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.size = cleanValue;
      updateSetting({ ...s, size: cleanValue });
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
            updateSetting({ ...s, actualSize: cleanValue });
          },
        },
      }
    : {}),
  [`${s.name}startPos`]: {
    label: "startPos",
    value: "\u200B" + s.startPos,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.startPos = cleanValue;
      updateSetting({ ...s, startPos: cleanValue });
    },
  },
  [`${s.name}speed`]: {
    label: "speed",
    value: "\u200B" + s.speed,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.speed = cleanValue;
      updateSetting({ ...s, speed: cleanValue });
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
            updateSetting({ ...s, rotationStart: cleanValue });
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
            updateSetting({ ...s, rotationSpeed: cleanValue });
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
      updateSetting({ ...s, tilt: cleanValue });
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
            updateSetting({ ...s, tiltb: cleanValue });
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
      updateSetting({ ...s, orbitRadius: cleanValue });
    },
  },
  [`${s.name}orbitCentera`]: {
    label: "orbitCentera",
    value: "\u200B" + s.orbitCentera,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitCentera = cleanValue;
      updateSetting({ ...s, orbitCentera: cleanValue });
    },
  },
  [`${s.name}orbitCenterb`]: {
    label: "orbitCenterb",
    value: "\u200B" + s.orbitCenterb,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitCenterb = cleanValue;
      updateSetting({ ...s, orbitCenterb: cleanValue });
    },
  },
  [`${s.name}orbitCenterc`]: {
    label: "orbitCenterc",
    value: "\u200B" + s.orbitCenterc,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitCenterc = cleanValue;
      updateSetting({ ...s, orbitCenterc: cleanValue });
    },
  },
  [`${s.name}orbitTilta`]: {
    label: "orbitTilta",
    value: "\u200B" + s.orbitTilta,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitTilta = cleanValue;
      updateSetting({ ...s, orbitTilta: cleanValue });
    },
  },
  [`${s.name}orbitTiltb`]: {
    label: "orbitTiltb",
    value: "\u200B" + s.orbitTiltb,
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitTiltb = cleanValue;
      updateSetting({ ...s, orbitTiltb: cleanValue });
    },
  },
});

// The inner component containing the hooks only mounts when the menu is active
const EditSettingsPanel = () => {
  const showPlanets = useStore((s) => s.showPlanets);
  const setShowPlanets = useStore((s) => s.setShowPlanets);
  const setEditSettings = useStore((s) => s.setEditSettings); // NEW
  const positions = usePosStore((s) => s.positions);
  const { settings, updateSetting, resetSettings } = useSettingsStore();

  const initialDeferentStates = useRef({});

  // Highly targeted DOM injection for the X button
  useEffect(() => {
    const interval = setInterval(() => {
      // Find the deepest div containing ONLY the exact title text
      const textDiv = Array.from(document.querySelectorAll("div")).find(
        (el) =>
          el.textContent.trim() === "Edit Settings" && el.children.length === 0
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
            setEditSettings(false);
          };

          titleBar.appendChild(closeBtn);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [setEditSettings]);

  useEffect(() => {
    // 1. Capture original visibility of all deferents on mount
    settings.forEach((s) => {
      if (
        s.name.includes("deferent") &&
        initialDeferentStates.current[s.name] === undefined
      ) {
        initialDeferentStates.current[s.name] = s.visible;
      }
    });

    // 2. Restore them back when menu closes - UNLESS the user explicitly changed them
    return () => {
      const currentStoreSettings = useSettingsStore.getState().settings;
      currentStoreSettings.forEach((s) => {
        if (s.name.includes("deferent")) {
          const originalVisibility = initialDeferentStates.current[s.name];
          if (
            originalVisibility !== undefined &&
            s.visible !== originalVisibility
          ) {
            useSettingsStore
              .getState()
              .updateSetting({ ...s, visible: originalVisibility });
          }
        }
      });
    };
  }, []);

  const settingsFolders = useMemo(() => {
    const groups = {};
    const showHideMenu = {};
    const settingsMenu = {};

    settings.forEach((s) => {
      let parent = s.name;
      if (s.name.includes("deferent")) {
        parent = s.name.split(" deferent")[0];
      }

      if (!groups[parent]) {
        groups[parent] = { main: null, deferents: [] };
      }

      if (s.name.includes("deferent")) {
        groups[parent].deferents.push(s);
      } else {
        groups[parent].main = s;
      }
    });

    Object.keys(groups).forEach((parentName) => {
      const group = groups[parentName];

      showHideMenu[`${parentName}visible`] = {
        label: parentName,
        value: group.main ? group.main.visible : true,
        editable: true,
        onChange: (value, path, context) => {
          // Detect if this is Leva's automatic sync, or a real click from the user
          const isInitialSync = context
            ? context.initial
            : group.main
            ? group.main.visible === value
            : group.deferents[0]?.visible === value;

          if (group.main) {
            group.main.visible = value;
            updateSetting({ ...group.main, visible: value });
          }
          group.deferents.forEach((def) => {
            def.visible = value;
            updateSetting({ ...def, visible: value });

            // FIX: If the user explicitly clicked the toggle, save it as the new "initial state"
            // so the cleanup effect doesn't erase their action!
            if (!isInitialSync) {
              initialDeferentStates.current[def.name] = value;
            }
          });
        },
      };

      const planetSubmenus = {};

      if (group.main) {
        planetSubmenus["Main Orbit"] = folder(
          getControls(group.main, updateSetting)
        );
      }

      group.deferents.forEach((def) => {
        planetSubmenus[def.name] = folder(getControls(def, updateSetting));
      });

      settingsMenu[parentName] = folder(planetSubmenus, { collapsed: true });
    });

    return {
      "Load settings": button(() => loadSettingsFromFile()),
      "Save settings": button(() => saveSettingsAsJson(settings)),
      "Reset settings": button(() => resetSettings()),
      "Show / Hide Planets": {
        value: showPlanets,
        onChange: (v) => setShowPlanets(v),
      },
      "Show / Hide settings": folder(showHideMenu, { collapsed: false }),
      Settings: folder(settingsMenu, { collapsed: false }),
    };
  }, [settings, updateSetting, showPlanets, setShowPlanets]);

  const levaSettingsStore = useCreateStore();

  const [, set] = useControls(() => settingsFolders, {
    store: levaSettingsStore,
  });

  useEffect(() => {
    const updatedValues = {
      "Show / Hide Planets": showPlanets,
    };
    settings.forEach((s) => {
      if (!s.name.includes("deferent")) {
        updatedValues[`${s.name}visible`] = s.visible;
      }
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
  }, [settings, set, showPlanets]);

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
        titleBar={{ drag: true, title: "Edit Settings", filter: false }}
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

const EditSettings = () => {
  const editSettings = useStore((s) => s.editSettings);

  if (!editSettings) return null;

  return <EditSettingsPanel />;
};

export default EditSettings;
