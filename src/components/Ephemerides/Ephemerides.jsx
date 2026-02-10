import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useControls, useCreateStore, Leva, button } from "leva";
import { useStore, useSettingsStore } from "../../store";
import {
  isValidDate,
  posToDate,
  speedFactOpts,
  sDay,
} from "../../utils/time-date-functions";
import { useEphemeridesStore } from "./ephemeridesStore";

const Ephemerides = () => {
  const { ephimerides, posRef } = useStore();
  const { settings } = useSettingsStore();

  // Get setters and state from the store
  const setGenerationParams = useEphemeridesStore((s) => s.setGenerationParams);
  const setGenerationError = useEphemeridesStore((s) => s.setGenerationError);
  const isGenerating = useEphemeridesStore((s) => s.isGenerating);

  const levaEphStore = useCreateStore();

  const valuesRef = useRef({
    "Start Date": posToDate(posRef.current),
    "End Date": posToDate(posRef.current),
    "Step size": 1,
    "\u{000D}": sDay,
  });

  const checkboxes = {};
  settings.forEach((s) => {
    if (s.type === "planet" && s.name !== "Earth") {
      if (valuesRef.current[s.name] === undefined) {
        valuesRef.current[s.name] = false;
      }
      checkboxes[s.name] = {
        value: false,
        onChange: (v) => {
          valuesRef.current[s.name] = v;
        },
      };
    }
  });

  const handleCreate = () => {
    // Prevent execution if already generating
    if (isGenerating) return;

    const formValues = valuesRef.current;

    const checkedPlanets = settings
      .filter((s) => s.type === "planet" && s.name !== "Earth")
      .filter((s) => formValues[s.name] === true)
      .map((s) => s.name);

    // --- VALIDATION CHECKS ---

    // 1. Check if at least one planet is selected
    if (checkedPlanets.length === 0) {
      setGenerationError(
        "No planets selected.\nPlease select at least one planet to generate data."
      );
      return;
    }

    // 2. Date validation removed to allow reverse generation (End Date < Start Date)

    // Send command to the Controller inside the Canvas
    setGenerationParams({
      startDate: formValues["Start Date"],
      endDate: formValues["End Date"],
      stepSize: formValues["Step size"],
      stepFactor: formValues["\u{000D}"],
      checkedPlanets,
    });
  };

  const handleInvalidInput = (field, fallbackValue) => {
    levaEphStore.set({ [field]: fallbackValue });
    valuesRef.current[field] = fallbackValue;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  // Effect to update Start/End Date to current position when menu is opened
  useEffect(() => {
    if (ephimerides) {
      const currentDate = posToDate(posRef.current);

      valuesRef.current["Start Date"] = currentDate;
      valuesRef.current["End Date"] = currentDate;

      levaEphStore.set({
        "Start Date": currentDate,
        "End Date": currentDate,
      });
    }
  }, [ephimerides, posRef, levaEphStore]);

  useControls(
    {
      Generate: button(handleCreate, { disabled: isGenerating }),
      "Start Date": {
        value: posToDate(posRef.current),
        onChange: (v) => {
          valuesRef.current["Start Date"] = v;
        },
        onEditEnd: (value) => {
          if (!isValidDate(value))
            handleInvalidInput("Start Date", posToDate(posRef.current));
        },
      },
      "End Date": {
        value: posToDate(posRef.current),
        onChange: (v) => {
          valuesRef.current["End Date"] = v;
        },
        onEditEnd: (value) => {
          if (!isValidDate(value))
            handleInvalidInput("End Date", posToDate(posRef.current));
        },
      },
      "Step size": {
        value: 1,
        onChange: (v) => {
          valuesRef.current["Step size"] = v;
        },
        onEditEnd: (value) => {
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) handleInvalidInput("Step size", 1);
        },
      },
      "\u{000D}": {
        value: sDay,
        options: speedFactOpts,
        onChange: (v) => {
          valuesRef.current["\u{000D}"] = v;
        },
      },
      ...checkboxes,
    },
    { store: levaEphStore },
    [settings, isGenerating]
  );

  if (!ephimerides) return null;

  return createPortal(
    <div
      className="ephemerides-div"
      style={{
        position: "fixed",
        top: "80px",
        right: "10px",
        zIndex: 2147483647,
      }}
    >
      <Leva
        store={levaEphStore}
        titleBar={{ drag: true, title: "Ephemerides", filter: false }}
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

export default Ephemerides;
