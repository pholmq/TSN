import { useEffect, useRef } from "react";
import { useControls, useCreateStore, Leva, button } from "leva";
import { useStore, useSettingsStore, usePlotStore } from "../../store";
import {
  isValidDate,
  posToDate,
  speedFactOpts,
  sDay,
} from "../../utils/time-date-functions";
import { usePlotterStore } from "./plotStore";

const Plot = () => {
  const { plot, posRef } = useStore(); // Using existing posRef
  const { settings } = useSettingsStore();

  // We reuse the 'ephimerides' flag in the main store to show this UI,
  // or you might want to create a new 'showPlot' flag in your main store.
  // Assuming for now we rely on a similar trigger or a new one.
  // *Note: You likely need to add a 'plot' boolean to your main store.js if you want a separate menu toggle.*
  // For this example, I will assume this component is rendered when active.

  const setGenerationParams = usePlotStore((s) => s.setGenerationParams);
  const isGenerating = usePlotStore((s) => s.isGenerating);
  const clearResults = usePlotStore((s) => s.clearResults);

  const levaPlotStore = useCreateStore();

  const valuesRef = useRef({
    "Start Date": posToDate(posRef.current),
    "End Date": posToDate(posRef.current),
    "Step size": 1,
    "\u{000D}": sDay,
  });

  const checkboxes = {};
  settings.forEach((s) => {
    if (s.type === "planet") {
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
    if (isGenerating) return;

    const formValues = valuesRef.current;

    const checkedPlanets = settings
      .filter((s) => s.type === "planet")
      .filter((s) => formValues[s.name] === true)
      .map((s) => s.name);

    setGenerationParams({
      startDate: formValues["Start Date"],
      endDate: formValues["End Date"],
      stepSize: formValues["Step size"],
      stepFactor: formValues["\u{000D}"],
      checkedPlanets,
    });
  };

  const handleInvalidInput = (field, fallbackValue) => {
    levaPlotStore.set({ [field]: fallbackValue });
    valuesRef.current[field] = fallbackValue;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  // Initialize dates
  useEffect(() => {
    if (posRef.current) {
      const currentDate = posToDate(posRef.current);
      valuesRef.current["Start Date"] = currentDate;
      valuesRef.current["End Date"] = currentDate;
      levaPlotStore.set({
        "Start Date": currentDate,
        "End Date": currentDate,
      });
    }
  }, [posRef, levaPlotStore]);

  useControls(
    {
      "Generate Plots": button(handleCreate, { disabled: isGenerating }),
      "Clear Plots": button(clearResults),
      "Start Date": {
        value: posToDate(posRef.current || 0),
        onChange: (v) => {
          valuesRef.current["Start Date"] = v;
        },
        onEditEnd: (value) => {
          if (!isValidDate(value))
            handleInvalidInput("Start Date", posToDate(posRef.current));
        },
      },
      "End Date": {
        value: posToDate(posRef.current || 0),
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
    { store: levaPlotStore },
    [settings, isGenerating]
  );

  return (
    <>
      {plot && (
        <div className="settings-div">
          <Leva
            store={levaPlotStore}
            titleBar={{ drag: true, title: "Plot Generator", filter: false }}
            fill={false}
            hideCopyButton
            theme={{
              fontSizes: { root: "16px" },
              fonts: { mono: "" },
              colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
            }}
          />
        </div>
      )}
    </>
  );
};

export default Plot;
