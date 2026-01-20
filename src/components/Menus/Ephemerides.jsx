import { useEffect, useRef } from "react";
import { useControls, useCreateStore, Leva, button } from "leva";
import { useStore, useSettingsStore, usePlotStore } from "../../store";
import {
  isValidDate,
  posToDate,
  posToTime,
  dateTimeToPos,
  speedFactOpts,
  sDay,
} from "../../utils/time-date-functions";
import { getRaDecDistance } from "../../utils/celestial-functions";

// Logic copied from Trace.jsx to simulate movement
function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    if (pObj.orbitRef && pObj.orbitRef.current) {
      pObj.orbitRef.current.rotation.y =
        pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
      pObj.orbitRef.current.updateMatrixWorld(true);
    }
  });
}

const Ephemerides = () => {
  const { ephimerides, posRef } = useStore();
  const { settings } = useSettingsStore();

  const plotObjects = usePlotStore((s) => s.plotObjects);
  const plotObjectsRef = useRef(plotObjects);

  // Keep the ref synced with the store to avoid stale closures
  useEffect(() => {
    plotObjectsRef.current = plotObjects;
  }, [plotObjects]);

  // Create a custom Leva store so this menu is independent
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

  const generateEphemerides = (
    startDate,
    endDate,
    stepSize,
    stepFactor,
    checkedPlanets
  ) => {
    console.log("--- Generating Ephemerides ---");

    const currentPlotObjects = plotObjectsRef.current;

    if (!currentPlotObjects || currentPlotObjects.length === 0) {
      console.warn("Plot objects not ready.");
      return;
    }

    // --- Helper: Find Scene by traversing up from a planet object ---
    const findScene = (objects) => {
      const validObj = objects.find((o) => o.orbitRef && o.orbitRef.current);
      if (validObj) {
        let obj = validObj.orbitRef.current;
        while (obj) {
          if (obj.type === "Scene") return obj;
          obj = obj.parent;
        }
      }
      return null;
    };

    const scene = findScene(currentPlotObjects);

    if (!scene) {
      console.error("Could not find 3D Scene. Ensure planets are rendered.");
      return;
    }

    const startPos = dateTimeToPos(startDate, "12:00:00");
    const endPos = dateTimeToPos(endDate, "12:00:00");
    const increment = stepSize * stepFactor;

    const ephemeridesData = {};
    checkedPlanets.forEach((planet) => {
      ephemeridesData[planet] = [];
    });

    const originalPos = posRef.current;
    let currentPos = startPos;
    let steps = 0;
    const MAX_STEPS = 50000;

    try {
      while (currentPos <= endPos && steps < MAX_STEPS) {
        // 1. Move simulation to current time
        moveModel(currentPlotObjects, currentPos);

        const currentDate = posToDate(currentPos);
        const currentTime = posToTime(currentPos); // Now returns correct 00:00:00 format

        // 2. Calculate Data
        checkedPlanets.forEach((name) => {
          const data = getRaDecDistance(name, scene);

          ephemeridesData[name].push({
            date: currentDate,
            time: currentTime,
            ra: data.ra,
            dec: data.dec,
            dist: data.dist,
          });
        });

        currentPos += increment;
        steps++;
      }
    } catch (err) {
      console.error("Error generating ephemerides:", err);
    } finally {
      // 3. Restore model to original state
      moveModel(currentPlotObjects, originalPos);
    }

    console.log(`Generation Complete. Steps: ${steps}`);
    console.log("Ephemerides Data:", ephemeridesData);
  };

  const handleInvalidInput = (field, fallbackValue) => {
    levaEphStore.set({ [field]: fallbackValue });
    valuesRef.current[field] = fallbackValue;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  useControls(
    {
      Create: button(() => {
        const formValues = valuesRef.current;

        const checkedPlanets = settings
          .filter((s) => s.type === "planet" && s.name !== "Earth")
          .filter((s) => formValues[s.name] === true)
          .map((s) => s.name);

        generateEphemerides(
          formValues["Start Date"],
          formValues["End Date"],
          formValues["Step size"],
          formValues["\u{000D}"],
          checkedPlanets
        );
      }),
      "Start Date": {
        value: posToDate(posRef.current),
        onChange: (v) => {
          valuesRef.current["Start Date"] = v;
        },
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
        },
        onEditEnd: (value) => {
          if (!isValidDate(value)) {
            handleInvalidInput("End Date", posToDate(posRef.current));
          }
        },
      },
      "Step size": {
        value: 1,
        // step: 1, <--- Removed to allow decimals
        onChange: (v) => {
          valuesRef.current["Step size"] = v;
        },
        onEditEnd: (value) => {
          const num = parseFloat(value);
          // Only reject if it's not a number or <= 0
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
        },
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
