import { useControls } from "leva";
import { useEffect, useMemo } from "react";
import { useStore, useSettingsStore, useTraceStore } from "../../store";
import Trace from "./Trace";

const TraceController = () => {
  const { settings } = useSettingsStore();
  const { trace, setTraceStart } = useTraceStore();
  const posRef = useStore((s) => s.posRef);

  // OPTIMIZATION: Memoize the configuration object to prevent re-creation on every render
  const planetsConfig = useMemo(() => {
    const checkboxes = { "Planets:": { value: "", editable: false } };

    settings
      .filter((item) => item.traceable)
      .forEach((item) => {
        checkboxes[item.name] = item.name === "Mars"; // Default Mars to true
      });

    return checkboxes;
  }, [settings]);

  const tracedPlanets = useControls("Trace", planetsConfig);

  // Filter out the planets that are checked
  // OPTIMIZATION: Memoize this list so we don't map/filter on every render
  const checkedPlanets = useMemo(
    () =>
      Object.keys(tracedPlanets).filter(
        (key) => tracedPlanets[key] === true && key !== "Planets:"
      ),
    [tracedPlanets]
  );

  useEffect(() => {
    if (trace) {
      setTraceStart(posRef.current);
    }
  }, [trace, setTraceStart]); // Added dependency

  return (
    <>
      {checkedPlanets.map((item) => (
        <Trace name={item} key={item} />
      ))}
    </>
  );
};

export default TraceController;
