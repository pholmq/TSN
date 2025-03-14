import { useControls } from "leva";
import { useEffect } from "react";
import { useStore, useSettingsStore, useTraceStore } from "../../store";
import Trace from "./Trace";
const TraceController = () => {
  const { settings } = useSettingsStore();
  const { trace, setTraceStart } = useTraceStore();
  const posRef = useStore((s) => s.posRef);
  
  const traceablePlanets = settings
    .filter((item) => item.traceable)
    .map((item) => item.name);

  //Create a leva checkbox object for each traceable planet
  const checkboxes = {};
  traceablePlanets.forEach((item) => {
    checkboxes[item] = false;
  });
  //Mars should be on by default
  checkboxes.Mars = true;

  const tracedPlanets = useControls("Trace", {
    "Planets:": { value: "", editable: false },
    ...checkboxes,
  });

  //Filter out the planets that are checked
  const checkedPlanets = Object.keys(tracedPlanets)
    .filter((key) => tracedPlanets[key] === true)
    .map((key) => key);

  //If trace is turned on, update trace startPos
  useEffect(() => {
    if (trace) {
      setTraceStart(posRef.current);
    }
  }, [trace]);

  // Trace checked planets
  return (
    <>
      {checkedPlanets.map((item, index) => (
        <Trace name={item} key={index} />
      ))}
    </>
  );
};

export default TraceController;
