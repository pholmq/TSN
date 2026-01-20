import { useEffect, useMemo, useRef } from "react";
import { useControls, useCreateStore, Leva, button } from "leva";
import { useStore, useSettingsStore } from "../../store";
import { saveSettingsAsJson } from "../../utils/saveAndLoadSettings";
import {
  isValidDate,
  posToDate,
  speedFactOpts,
  sDay,
} from "../../utils/time-date-functions";

const Ephemerides = () => {
  const { ephimerides, posRef } = useStore();
  const { settings } = useSettingsStore();

  // Create a custom Leva store
  const levaEphStore = useCreateStore();

  // 1. Use a ref to track the form state manually.
  // This avoids the 'undefined' error from store.get()
  const valuesRef = useRef({
    "Start Date": posToDate(posRef.current),
    "End Date": posToDate(posRef.current),
    "Step size": 1,
    "\u{000D}": sDay, // Initialize with default step factor (Day)
  });

  const checkboxes = {};
  settings.forEach((s) => {
    if (s.type === "planet" && s.name !== "Earth") {
      // Ensure the ref has a default value for this planet
      if (valuesRef.current[s.name] === undefined) {
        valuesRef.current[s.name] = false;
      }

      checkboxes[s.name] = {
        value: false,
        // Update the ref whenever the checkbox changes
        onChange: (v) => {
          valuesRef.current[s.name] = v;
        },
      };
    }
  });

  const logEphemeridesData = (
    startDate,
    endDate,
    stepSize,
    stepFactor,
    checkedPlanets
  ) => {
    console.log("--- Create Ephemerides Triggered ---");
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Step Size:", stepSize);
    console.log("Step Factor:", stepFactor);
    console.log("Checked Planets:", checkedPlanets);
  };

  // Helper to force UI update
  const handleInvalidInput = (field, fallbackValue) => {
    levaEphStore.set({ [field]: fallbackValue });
    // Update our ref to match the fallback
    valuesRef.current[field] = fallbackValue;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  useControls(
    {
      Create: button(() => {
        // 2. Read from the safe valuesRef instead of levaEphStore.get()
        const formValues = valuesRef.current;

        const checkedPlanets = settings
          .filter((s) => s.type === "planet" && s.name !== "Earth")
          .filter((s) => formValues[s.name] === true)
          .map((s) => s.name);

        logEphemeridesData(
          formValues["Start Date"],
          formValues["End Date"],
          formValues["Step size"],
          formValues["\u{000D}"], // Pass the step factor
          checkedPlanets
        );

        // saveSettingsAsJson(settings, formValues);
      }),
      "Start Date": {
        value: posToDate(posRef.current),
        onChange: (v) => {
          valuesRef.current["Start Date"] = v;
        }, // Sync ref
        onEditEnd: (value) => {
          if (!isValidDate(value)) {
            handleInvalidInput("Start Date", posToDate(posRef.current));
          }
        },
      },
      "End Date": {
        value: posToDate(posRef.current),
        onChange: (v) => {
          valuesRef.current["End Date"] = v;
        }, // Sync ref
        onEditEnd: (value) => {
          if (!isValidDate(value)) {
            handleInvalidInput("End Date", posToDate(posRef.current));
          }
        },
      },
      "Step size": {
        value: 1,
        step: 1,
        onChange: (v) => {
          valuesRef.current["Step size"] = v;
        }, // Sync ref
        onEditEnd: (value) => {
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) {
            handleInvalidInput("Step size", 1);
          }
        },
      },
      "\u{000D}": {
        value: sDay,
        options: speedFactOpts,
        onChange: (v) => {
          valuesRef.current["\u{000D}"] = v;
        }, // Sync ref for the dropdown
      },
      ...checkboxes,
    },
    { store: levaEphStore },
    [settings]
  );

  return (
    <>
      {ephimerides && (
        <div className="settings-div">
          <Leva
            store={levaEphStore}
            titleBar={{ drag: true, title: "Ephemerides", filter: false }}
            fill={false}
            hideCopyButton
            theme={{
              fontSizes: {
                root: "16px",
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

export default Ephemerides;
