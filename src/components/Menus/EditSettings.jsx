import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, folder, button } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";
import {
  saveSettingsAsJson,
  loadSettingsFromFile,
} from "../../utils/saveAndLoadSettings";
import {
  getBodySettingNames,
  getCelestialEditorGroups,
} from "../../utils/celestialModel";

const SETTING_FIELDS = [
  "size",
  "actualSize",
  "startPos",
  "speed",
  "rotationStart",
  "rotationSpeed",
  "tilt",
  "tiltb",
  "orbitRadius",
  "orbitCenterx",
  "orbitCentery",
  "orbitCenterz",
  "orbitTiltx",
  "orbitTilty",
  "orbitTiltz",
];

const OPERATION_PARAMETER_LABELS = {
  inequalityRadius: "2D−M solar modulation",
  variationRadius: "2D solar modulation",
  pairedRadialRadius: "Earth–Moon modulation",
};

const EDITOR_LABELS = {
  SystemCenter: "PVP / Observer Frame",
};

const editorLabel = (name) => EDITOR_LABELS[name] || name;

const isZeroValue = (value) => {
  const number = Number(String(value).replace(/\u200B/g, "").trim());
  return Number.isFinite(number) && number === 0;
};

const getControls = (s, updateSetting) => {
  const standardControls = Object.fromEntries(
    SETTING_FIELDS.filter((key) => s[key] !== undefined).map((key) => [
      `${s.name}_${key}`,
      {
        label: key,
        value: "\u200B" + s[key],
        editable: true,
        render: (get) => Boolean(get("Show zero values")) || !isZeroValue(s[key]),
        onChange: (value) => {
          const cleanValue = String(value).replace(/\u200B/g, "");
          updateSetting({ ...s, [key]: cleanValue });
        },
      },
    ])
  );

  const operationParameters = s.operationParameters || {};
  const operationControls = Object.fromEntries(
    Object.entries(operationParameters)
      .filter(([key, value]) =>
        (typeof value === "number" || typeof value === "string") &&
        key !== "pairedRadialPlane"
      )
      .map(([key, value]) => [
        `${s.name}_operation_${key}`,
        {
          label: OPERATION_PARAMETER_LABELS[key] || key,
          value: "\u200B" + value,
          editable: true,
          render: (get) => Boolean(get("Show zero values")) || !isZeroValue(value),
          onChange: (nextValue) => {
            const cleanValue = String(nextValue).replace(/\u200B/g, "");
            updateSetting({
              ...s,
              operationParameters: { ...operationParameters, [key]: cleanValue },
            });
          },
        },
      ])
  );

  return {
    ...standardControls,
    ...(Object.keys(operationControls).length > 0
      // Lunar modulation parameters are part of the declared lunar model,
      // rather than an opaque implementation detail. Keep them directly in
      // their named model stage; other motion operations retain the generic
      // group for now.
      ? s.motionOperation === "solar-coupled-centre-offset"
        ? operationControls
        : { "Geometry operation": folder(operationControls, { collapsed: false }) }
      : {}),
  };
};

const editorValueUpdates = (settings, levaStore) => {
  const data = levaStore?.getData?.();
  if (!data) return {};

  const updates = {};
  settings.forEach((setting) => {
    SETTING_FIELDS.forEach((field) => {
      if (setting[field] === undefined) return;
      const controlName = `${setting.name}_${field}`;
      const path = Object.keys(data).find((candidate) =>
        candidate.endsWith(controlName)
      );
      if (path) updates[path] = `\u200B${setting[field]}`;
    });

    Object.entries(setting.operationParameters || {}).forEach(([key, value]) => {
      if (
        (typeof value !== "number" && typeof value !== "string") ||
        key === "pairedRadialPlane"
      ) {
        return;
      }
      const controlName = `${setting.name}_operation_${key}`;
      const path = Object.keys(data).find((candidate) =>
        candidate.endsWith(controlName)
      );
      if (path) updates[path] = `\u200B${value}`;
    });
  });
  return updates;
};

const SettingsLeva = ({ settingsFolders, settings, settingsResetRevision }) => {
  const levaSettingsStore = useCreateStore();
  const lastResetRevision = useRef(settingsResetRevision);

  useControls(() => settingsFolders, { store: levaSettingsStore });

  useEffect(() => {
    if (lastResetRevision.current === settingsResetRevision) return;
    lastResetRevision.current = settingsResetRevision;

    const updates = editorValueUpdates(settings, levaSettingsStore);
    if (Object.keys(updates).length > 0) {
      // Existing paths are unchanged by Reset, so this refresh does not
      // collapse the folders the user currently has open.
      levaSettingsStore.set(updates, false);
    }
  }, [levaSettingsStore, settings, settingsResetRevision]);

  return (
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
  );
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
  const {
    settings,
    updateSetting,
    resetSettings,
    settingsResetRevision,
  } = useSettingsStore();
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
      if (initialDeferentStates.current[s.name] === undefined) {
        initialDeferentStates.current[s.name] = s.visible;
      }
    });
    return () => {
      const currentStoreSettings = useSettingsStore.getState().settings;
      currentStoreSettings.forEach((s) => {
        const originalVisibility = initialDeferentStates.current[s.name];
        if (originalVisibility !== undefined && s.visible !== originalVisibility) {
          useSettingsStore.getState().updateSetting({ ...s, visible: originalVisibility });
        }
      });
    };
  }, []);

  const settingsFolders = useMemo(() => {
    const celestialBodiesMenu = {};
    const bodySettingNames = new Set(getBodySettingNames());
    getCelestialEditorGroups(settings).forEach((editorGroup) => {
      const buildBodyControls = (body) => {
        const bodyControls = {};
        if (bodySettingNames.has(body.name) && typeof body.setting.visible === "boolean") {
          bodyControls[`${body.name}_visible`] = {
            label: "Visible",
            value: body.setting.visible,
            onChange: (value) => updateSetting({ ...body.setting, visible: value }),
          };
        }
        body.frames.forEach((frame) => {
          const frameControls = {};
          frame.settings.forEach((setting) => {
            frameControls[editorLabel(setting.name)] = folder(
              getControls(setting, updateSetting),
              { collapsed: true }
            );
          });
          bodyControls[frame.name] = folder(frameControls, { collapsed: true });
        });
        body.children.forEach((child) => {
          bodyControls[editorLabel(child.name)] = folder(
            buildBodyControls(child),
            { collapsed: true }
          );
        });
        return bodyControls;
      };

      const groupControls = editorGroup.flattenBody && editorGroup.bodies.length === 1
        ? buildBodyControls(editorGroup.bodies[0])
        : Object.fromEntries(editorGroup.bodies.map((body) => [
            editorLabel(body.name),
            folder(buildBodyControls(body), { collapsed: true }),
          ]));
      celestialBodiesMenu[editorGroup.name] = folder(groupControls, {
        collapsed: true,
      });
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
      "Show zero values": {
        value: false,
        label: "Show zero values",
      },
      Settings: folder(celestialBodiesMenu, { collapsed: false }),
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
      <SettingsLeva
        settingsFolders={settingsFolders}
        settings={settings}
        settingsResetRevision={settingsResetRevision}
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
