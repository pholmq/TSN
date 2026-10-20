import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";
import {
  saveSettingsAsJson,
  loadSettingsFromFile,
} from "../../utils/saveAndLoadSettings";
import { getStageInfo, isMainStage } from "../../utils/celestialModel";

const createTextControl = (s, key, label, hint, updateSetting) => {
  return {
    [`${s.name}_${key}`]: {
      label: label,
      value: "\u200B" + (s[key] ?? 0),
      hint: hint, 
      editable: true,
      onChange: (value) => {
        const cleanValue = String(value).replace(/\u200B/g, "");
        s[key] = cleanValue;
        updateSetting({ ...s, [key]: cleanValue });
      },
    },
  };
};

const getControls = (s, updateSetting) => {
  return {
    Appearance: folder(
      {
        ...createTextControl(s, "size", "Size", "Visual size multiplier (when Actual Sizes is OFF)", updateSetting),
        ...(s.actualSize !== undefined
          ? createTextControl(s, "actualSize", "Actual Size", "True physical radius in model units", updateSetting)
          : {}),
      },
      { collapsed: false }
    ),
    Motion: folder(
      {
        ...createTextControl(s, "startPos", "Start Pos", "Starting position/angle on the orbital path (degrees)", updateSetting),
        ...createTextControl(s, "speed", "Speed", "Velocity around the orbital path", updateSetting),
        ...(s.rotationStart !== undefined
          ? createTextControl(s, "rotationStart", "Rot Start", "Initial rotation around its own axis (degrees)", updateSetting)
          : {}),
        ...(s.rotationSpeed !== undefined
          ? createTextControl(s, "rotationSpeed", "Rot Speed", "Speed of rotation around its own axis", updateSetting)
          : {}),
      },
      { collapsed: false }
    ),
    Orientation: folder(
      {
        ...createTextControl(s, "tilt", "Tilt X/Z", "Axial tilt against the orbital plane", updateSetting),
        ...(s.tiltb !== undefined
          ? createTextControl(s, "tiltb", "Tilt Y", "Secondary axial tilt correction", updateSetting)
          : {}),
      },
      { collapsed: false }
    ),
    "Orbit Path": folder(
      {
        ...createTextControl(s, "orbitRadius", "Radius", "Radius of the circular orbit", updateSetting),
        ...createTextControl(s, "orbitCenterx", "Center X", "Displacement of the orbit center along the X axis", updateSetting),
        ...createTextControl(s, "orbitCentery", "Center Y", "Displacement of the orbit center along the Y axis", updateSetting),
        ...createTextControl(s, "orbitCenterz", "Center Z", "Displacement of the orbit center along the Z axis", updateSetting),
      },
      { collapsed: false }
    ),
    "Orbit Tilt": folder(
      {
        ...createTextControl(s, "orbitTiltx", "Tilt X", "Rotates the entire orbital plane around the X axis", updateSetting),
        ...createTextControl(s, "orbitTilty", "Tilt Y", "Rotates the entire orbital plane around the Y axis", updateSetting),
        ...createTextControl(s, "orbitTiltz", "Tilt Z", "Rotates the entire orbital plane around the Z axis", updateSetting),
      },
      { collapsed: false }
    ),
  };
};

const EditSettingsPanel = () => {
  const showPlanets = useStore((s) => s.showPlanets);
  const setShowPlanets = useStore((s) => s.setShowPlanets);
  const shadeOrbits = useStore((s) => s.shadeOrbits);
  const setShadeOrbits = useStore((s) => s.setShadeOrbits);
  const editSettings = useStore((s) => s.editSettings);
  const setEditSettings = useStore((s) => s.setEditSettings);
  const showOrbitLabels = useStore((s) => s.showOrbitLabels);
  const setShowOrbitLabels = useStore((s) => s.setShowOrbitLabels);
  
  const positions = usePosStore((s) => s.positions);
  const { settings, updateSetting, resetSettings } = useSettingsStore();
  const initialDeferentStates = useRef({});

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
    const celestialBodiesMenu = {};

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
      const planetSubmenus = {};

      planetSubmenus[`${parentName}_visible`] = {
        label: "👁️ Visible",
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

      if (group.main) {
        planetSubmenus["Main Orbit"] = folder(
          getControls(group.main, updateSetting), 
          { collapsed: true }
        );
      }
      group.deferents.forEach((def) => {
        planetSubmenus[def.name] = folder(
          getControls(def, updateSetting), 
          { collapsed: true }
        );
      });

      celestialBodiesMenu[parentName] = folder(planetSubmenus, { collapsed: true });
    });

    return {
      "Global Actions": folder({
        "Load settings": button(() => loadSettingsFromFile()),
        "Save settings": button(() => saveSettingsAsJson(settings)),
        "Reset settings": button(() => resetSettings()),
      }),
      "Global Display": folder({
        "Show / Hide Planets": {
          value: showPlanets,
          onChange: (v) => setShowPlanets(v),
        },
        "Filled Orbits": {
          value: shadeOrbits,
          onChange: (v) => setShadeOrbits(v),
        },
        "Orbit labels": {
          value: showOrbitLabels,
          onChange: (v) => setShowOrbitLabels(v),
        }
      }),
      "Celestial Bodies": folder(celestialBodiesMenu, { collapsed: false }),
    };
  }, [
    settings,
    updateSetting,
    showPlanets,
    setShowPlanets,
    shadeOrbits,
    setShadeOrbits,
    showOrbitLabels,
    setShowOrbitLabels
  ]);

  const levaSettingsStore = useCreateStore();
  const [, set] = useControls(() => settingsFolders, {
    store: levaSettingsStore,
  });

  useEffect(() => {
    const updatedValues = {
      "Show / Hide Planets": showPlanets,
      "Filled Orbits": shadeOrbits,
      "Orbit labels": showOrbitLabels,
    };
    
    settings.forEach((s) => {
      if (isMainStage(s.name)) {
        updatedValues[`${s.name}_visible`] = s.visible;
      }
      
      const syncVal = (key) => {
        if (s[key] !== undefined) {
          updatedValues[`${s.name}_${key}`] = "\u200B" + s[key];
        }
      };

      syncVal("size");
      syncVal("actualSize");
      syncVal("startPos");
      syncVal("speed");
      syncVal("rotationStart");
      syncVal("rotationSpeed");
      syncVal("tilt");
      syncVal("tiltb");
      syncVal("orbitRadius");
      syncVal("orbitCenterx");
      syncVal("orbitCentery");
      syncVal("orbitCenterz");
      syncVal("orbitTiltx");
      syncVal("orbitTilty");
      syncVal("orbitTiltz");
    });
    
    set(updatedValues);
  }, [settings, set, showPlanets, shadeOrbits, showOrbitLabels]);

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