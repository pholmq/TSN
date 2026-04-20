import { useRef, useEffect } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore } from "../store";
import { speedFactOpts } from "../utils/time-date-functions";
import {
  useMainControlsConfig,
  useTraceConfig,
  usePlanetOrbitsConfig,
  useStarsHelpersConfig,
} from "./Menus/menuConfigs";

const LevaUI = () => {
  const levaStore = useCreateStore();
  const {
    showLevaMenu,
    speedMultiplier,
    setSpeedMultiplier,
    speedFact,
    setSpeedFact,
    actualPlanetSizes,
    orbits,
    ephimerides,
    showPositions,
    searchStars,
    planetCamera,
    cameraTransitioning,
    setOrbits,
    setActualPlanetSizes,
  } = useStore();

  // Load extracted configurations
  const mainControls = useMainControlsConfig();
  const traceControls = useTraceConfig();
  const planetOrbitsControls = usePlanetOrbitsConfig();
  const starsHelpersControls = useStarsHelpersConfig();

  const [, set1] = useControls(
    () => ({
      "1 sec/step equals": {
        value: speedMultiplier,
        step: 1,
        onChange: setSpeedMultiplier,
      },
      "\u{000D}": {
        value: speedFact,
        options: speedFactOpts,
        onChange: setSpeedFact,
      },
    }),
    { store: levaStore }
  );

  const [, set2] = useControls(() => ({
    Controls: folder(mainControls, { collapsed: false }),
    Trace: folder(traceControls, { collapsed: true }),
    "Planets & Orbits": folder(planetOrbitsControls, { collapsed: true }),
    "Stars & Helpers": folder(starsHelpersControls, { collapsed: true }),
    Settings: folder({}, { collapsed: true }),
  }));

  // Sync state changes triggered outside of Leva back into the UI
  useEffect(() => {
    set2({
      "Actual planet sizes": actualPlanetSizes,
      Orbits: orbits,
      Ephemerides: ephimerides,
      Positions: showPositions,
      Search: searchStars,
    });
  }, [
    actualPlanetSizes,
    orbits,
    ephimerides,
    showPositions,
    searchStars,
    set2,
  ]);

  const prevTransitioningRef = useRef(false);
  useEffect(() => {
    setActualPlanetSizes(planetCamera ? true : false);
  }, [planetCamera, setActualPlanetSizes]);

  useEffect(() => {
    if (
      prevTransitioningRef.current === true &&
      cameraTransitioning === false &&
      planetCamera
    ) {
      setOrbits(false);
    }

    if (!planetCamera) {
      setOrbits(true);
    }

    prevTransitioningRef.current = cameraTransitioning;
  }, [planetCamera, cameraTransitioning, setOrbits]);

  return (
    <>
      <Leva
        store={levaStore}
        fill
        titleBar={false}
        hideCopyButton
        theme={{
          sizes: { controlWidth: "40%" },
          fontSizes: { root: "12px" },
          fonts: { mono: "" },
          colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
        }}
      />
      <div
        hidden={!showLevaMenu}
        style={{ maxHeight: "80vh", overflow: "auto" }}
      >
        <Leva
          fill
          titleBar={false}
          hideCopyButton
          theme={{
            sizes: { controlWidth: "40%" },
            fontSizes: { root: "12px" },
            fonts: { mono: "" },
            colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
          }}
        />
      </div>
    </>
  );
};

export default LevaUI;
