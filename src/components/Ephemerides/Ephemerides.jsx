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
  const { ephimerides, setEphemerides, posRef } = useStore();
  const { settings } = useSettingsStore();

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
    if (isGenerating) return;

    const formValues = valuesRef.current;

    const checkedPlanets = settings
      .filter((s) => s.type === "planet" && s.name !== "Earth")
      .filter((s) => formValues[s.name] === true)
      .map((s) => s.name);

    if (checkedPlanets.length === 0) {
      setGenerationError(
        "No planets selected.\nPlease select at least one planet to generate data."
      );
      return;
    }

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

  // Highly targeted DOM injection for the X button
  useEffect(() => {
    if (!ephimerides) return;

    const interval = setInterval(() => {
      // Find the deepest div containing ONLY the exact title text
      const textDiv = Array.from(document.querySelectorAll("div")).find(
        (el) =>
          el.textContent.trim() === "Ephemerides" && el.children.length === 0
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
            setEphemerides(false);
          };

          titleBar.appendChild(closeBtn);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [ephimerides, setEphemerides]);

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
        fill={false} // Restored to default so it behaves normally
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
