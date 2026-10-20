import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";
import {
  saveSettingsAsJson,
  loadSettingsFromFile,
} from "../../utils/saveAndLoadSettings";
import { getStageInfo, isMainStage } from "../../utils/celestialModel";

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
  [`${s.name}orbitCenterx`]: {
    label: "orbitCenterx",
    value: "\u200B" + (s.orbitCenterx ?? 0),
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitCenterx = cleanValue;
      updateSetting({ ...s, orbitCenterx: cleanValue });
    },
  },
  [`${s.name}orbitCentery`]: {
    label: "orbitCentery",
    value: "\u200B" + (s.orbitCentery ?? 0),
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitCentery = cleanValue;
      updateSetting({ ...s, orbitCentery: cleanValue });
    },
  },
  [`${s.name}orbitCenterz`]: {
    label: "orbitCenterz",
    value: "\u200B" + (s.orbitCenterz ?? 0),
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitCenterz = cleanValue;
      updateSetting({ ...s, orbitCenterz: cleanValue });
    },
  },
  [`${s.name}orbitTiltx`]: {
    label: "orbitTiltx",
    value: "\u200B" + (s.orbitTiltx ?? 0),
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitTiltx = cleanValue;
      updateSetting({ ...s, orbitTiltx: cleanValue });
    },
  },
  [`${s.name}orbitTilty`]: {
    label: "orbitTilty",
    value: "\u200B" + (s.orbitTilty ?? 0),
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitTilty = cleanValue;
      updateSetting({ ...s, orbitTilty: cleanValue });
    },
  },
  [`${s.name}orbitTiltz`]: {
    label: "orbitTiltz",
    value: "\u200B" + (s.orbitTiltz ?? 0),
    editable: true,
    onChange: (value) => {
      const cleanValue = value.replace(/\u200B/g, "");
      s.orbitTiltz = cleanValue;
      updateSetting({ ...s, orbitTiltz: cleanValue });
    },
  },
});

// The inner component containing the hooks only mounts when the menu is active
const EditSettingsPanel = () => {
  const showPlanets = useStore((s) => s.showPlanets);
  const setShowPlanets = useStore((s) => s.setShowPlanets);
  const shadeOrbits = useStore((s) => s.shadeOrbits);
  const setShadeOrbits = useStore((s) => s.setShadeOrbits);
  const setEditSettings = useStore((s) => s.setEditSettings);
  const positions = usePosStore((s) => s.positions);
  const { settings, updateSetting, resetSettings } = useSettingsStore();
  const initialDeferentStates = useRef({});

  // Highly targeted DOM injection for the X button
  useEffect(() => {
    let closeBtn;
    const interval = setInterval(() => {
      const textDiv = Array.from(document.querySelectorAll("div")).find(
        (el) => el.textContent.trim() === "Edit Settings" && el.children.length === 0
      );
      if (textDiv) {
        const titleBar = textDiv.parentElement;
        if (titleBar && !titleBar.querySelector(".leva-close-x")) {
          titleBar.style.position = "relative";
          closeBtn = document.createElement("div");
          closeBtn.className = "leva-close-x";
          closeBtn.innerHTML = "✕";
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
          closeBtn.onmouseenter = () => (closeBtn.style.color = "#FFFFFF");
          closeBtn.onmouseleave = () => (closeBtn.style.color = "#8C92A4");
          closeBtn.onmousedown = (e) => e.stopPropagation();
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditSettings(false);
          };
          titleBar.appendChild(closeBtn);
        }
      }
    }, 150);
    return () => {
      clearInterval(interval);
      if (closeBtn && closeBtn.parentNode) {
        closeBtn.parentNode.removeChild(closeBtn);
      }
    };
  }, [setEditSettings]);

  useEffect(() => {
    settings.forEach((s) => {
      if (!isMainStage(s.name) && initialDeferentStates.current[s.name] === undefined) {
        initialDeferentStates.current[s.name] = s.visible;
      }
    });
    return () => {
      const currentStoreSettings = useSettingsStore.getState().settings;
      currentStoreSettings.forEach((s) => {
        if (!isMainStage(s.name)) {
          const originalVisibility = initialDeferentStates.current[s.name];
          if (originalVisibility !== undefined && s.visible !== originalVisibility) {
            useSettingsStore.getState().updateSetting({ ...s, visible: originalVisibility });
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
      const info = getStageInfo(s.name);
      const parent = info ? info.bodyName : s.name;
      const isCarrier = info ? !info.isMain : false;
      if (!groups[parent]) {
        groups[parent] = { main: null, deferents: [] };
      }
      if (isCarrier) {
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
            if (!isInitialSync) {
              initialDeferentStates.current[def.name] = value;
            }
          });
        },
      };

      const planetSubmenus = {};
      if (group.main) {
        planetSubmenus["Main Orbit"] = folder(getControls(group.main, updateSetting));
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
      "Filled Orbits": {
        value: shadeOrbits,
        onChange: (v) => setShadeOrbits(v),
      },
      "Show / Hide settings": folder(showHideMenu, { collapsed: false }),
      Settings: folder(settingsMenu, { collapsed: false }),
    };
  }, [settings, updateSetting, showPlanets, setShowPlanets, shadeOrbits, setShadeOrbits]);

  const levaSettingsStore = useCreateStore();
  const [, set] = useControls(() => settingsFolders, {
    store: levaSettingsStore,
  });

  useEffect(() => {
    const updatedValues = {
      "Show / Hide Planets": showPlanets,
      "Filled Orbits": shadeOrbits,
    };
    settings.forEach((s) => {
      if (isMainStage(s.name)) {
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
      updatedValues[`${s.name}orbitCenterx`] = "\u200B" + (s.orbitCenterx ?? 0);
      updatedValues[`${s.name}orbitCentery`] = "\u200B" + (s.orbitCentery ?? 0);
      updatedValues[`${s.name}orbitCenterz`] = "\u200B" + (s.orbitCenterz ?? 0);
      updatedValues[`${s.name}orbitTiltx`] = "\u200B" + (s.orbitTiltx ?? 0);
      updatedValues[`${s.name}orbitTilty`] = "\u200B" + (s.orbitTilty ?? 0);
      updatedValues[`${s.name}orbitTiltz`] = "\u200B" + (s.orbitTiltz ?? 0);
    });
    set(updatedValues);
  }, [settings, set, showPlanets, shadeOrbits]);

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
          fontSizes: { root: "12px" },
          fonts: { mono: "" },
          colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
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