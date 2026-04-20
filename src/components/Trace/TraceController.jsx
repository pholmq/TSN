import { useEffect, useMemo } from "react";
import { useStore, useSettingsStore, useTraceStore } from "../../store";
import Trace from "./Trace";

const TraceController = () => {
  const { settings } = useSettingsStore();
  const { trace, setTraceStart } = useTraceStore();
  const posRef = useStore((s) => s.posRef);

  // OPTIMIZATION: Filter settings directly from the store based on the new `traced` property.
  // No Leva UI logic needed here anymore!
  const checkedPlanets = useMemo(() => {
    return settings
      .filter((s) => {
        if (!s.traceable) return false;
        // Fallback to true if it's Mars and undefined
        return s.traced !== undefined ? s.traced : s.name === "Mars";
      })
      .map((s) => s.name);
  }, [settings]);

  useEffect(() => {
    if (trace) {
      setTraceStart(posRef.current);
    }
  }, [trace, setTraceStart]);

  return (
    <>
      {checkedPlanets.map((item) => (
        <Trace name={item} key={item} />
      ))}
    </>
  );
};

export default TraceController;
