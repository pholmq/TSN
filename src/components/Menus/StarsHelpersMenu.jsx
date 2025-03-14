import { useControls } from "leva";
import { useStore, useStarStore } from "../../store";

const StarsHelpersMenu = () => {
  const { settings, updateSetting } = useStarStore();

  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const setStarDistanceModifier = useStore((s) => s.setStarDistanceModifier);
  //Create a leva checkbox object for each star
  const checkboxes = {};
  settings.forEach((s) => {
    checkboxes[s.name] = {
      value: s.visible,
      onChange: (v) => {
        //Create a copy and update the store. This will rerender all Cobj
        const sCopy = { ...s };
        sCopy.visible = v;
        updateSetting(sCopy);
      },
    };
  });

  useControls("Stars & Helpers", {
    "Stars:": { value: "", editable: false },
    ...checkboxes,
  });

  return null;
};

export default StarsHelpersMenu;
