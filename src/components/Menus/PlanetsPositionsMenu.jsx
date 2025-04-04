import { useControls } from "leva";
import { useSettingsStore } from "../../store";

const PlanetsPositionsMenu = () => {
  const { settings, updateSetting } = useSettingsStore();

  //Create a leva checkbox object for each planet
  const checkboxes = {};
  settings.forEach((s) => {
    if (s.type === "planet") {
      checkboxes[s.name] = {
        value: s.visible,
        onChange: (v) => {
          //Create a copy and update the store. This will rerender all Cobj
          const sCopy = { ...s };
          sCopy.visible = v;
          updateSetting(sCopy);
        },
      };
    }
  });

  useControls("Planet settings", {
    "Planets:": { value: "", editable: false },
    ...checkboxes,
  });

  return null;
};

export default PlanetsPositionsMenu;
