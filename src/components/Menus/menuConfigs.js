import { folder } from "leva";
import { useStore, useTraceStore, useSettingsStore } from "../../store";

export const useMainControlsConfig = () => {
  const {
    actualPlanetSizes,
    setActualPlanetSizes,
    planetCamera,
    setPlanetCamera,
    cameraFollow,
    setCameraFollow,
    showLabels,
    setShowLables,
    orbits,
    setOrbits,
    searchStars,
    setSearchStars,
    showPositions,
    setShowPositions,
    ephimerides,
    setEphemerides,
  } = useStore();

  return {
    "Actual planet sizes": {
      value: actualPlanetSizes,
      onChange: setActualPlanetSizes,
    },
    "Planet camera": { value: planetCamera, onChange: setPlanetCamera },
    "Camera follow": { value: cameraFollow, onChange: setCameraFollow },
    Labels: { value: showLabels, onChange: setShowLables },
    Orbits: { value: orbits, onChange: setOrbits },
    Search: { value: searchStars, onChange: setSearchStars },
    Positions: {
      value: showPositions,
      hint: "Keep unchecked for best performance",
      onChange: setShowPositions,
    },
    Ephemerides: { value: ephimerides, onChange: setEphemerides },
  };
};

export const useTraceConfig = () => {
  const {
    trace,
    setTrace,
    lineWidth,
    setLineWidth,
    dotted,
    setDotted,
    lengthMultiplier,
    setLengthMultiplier,
    stepMultiplier,
    setStepMultiplier,
  } = useTraceStore();
  const { settings, updateSetting } = useSettingsStore();

  const tracedPlanetsCheckboxes = {};

  settings.forEach((s) => {
    if (s.traceable) {
      tracedPlanetsCheckboxes[`${s.name}_trc`] = {
        label: s.name,
        value: s.traced !== undefined ? s.traced : s.name === "Mars",
        onChange: (v) => updateSetting({ name: s.name, traced: v }),
      };
    }
  });

  return {
    TraceOnOff: { label: "Trace On/Off", value: trace, onChange: setTrace },
    "Traced planets": folder(tracedPlanetsCheckboxes, { collapsed: true }),
    "Line width": {
      value: lineWidth,
      min: 0.5,
      max: 5,
      step: 0.5,
      onChange: setLineWidth,
    },
    "Dotted line": { value: dotted, onChange: setDotted },
    "Trace length": {
      value: lengthMultiplier,
      min: 0.5,
      max: 5,
      step: 0.5,
      onChange: setLengthMultiplier,
    },
    "Step length": {
      value: stepMultiplier,
      min: 1,
      max: 10,
      step: 1,
      onChange: setStepMultiplier,
    },
  };
};

export const usePlanetOrbitsConfig = () => {
  const {
    planetScale,
    setPlanetScale,
    orbitsLineWidth,
    setOrbitsLineWidth,
    globalArrowSize,
    setGlobalArrowSize,
    globalArrowCount,
    setGlobalArrowCount,
    globalArrowFixedSize,
    setGlobalArrowFixedSize,
  } = useStore();

  const { settings, updateSetting } = useSettingsStore();

  const polarLineCheckboxes = {};
  const orbitArrowsCheckboxes = {};
  const planetVisibilityCheckboxes = {};
  const filledOrbitsCheckboxes = {};
  const orbitVisibilityCheckboxes = {};

  settings.forEach((s) => {
    if (s.type === "planet") {
      planetVisibilityCheckboxes[`${s.name}_vis`] = {
        label: s.name,
        value: s.visible || false,
        onChange: (v) => updateSetting({ name: s.name, visible: v }),
      };
      orbitVisibilityCheckboxes[`${s.name}_orb`] = {
        label: s.name + "    ",
        value: s.orbitVisible !== undefined ? s.orbitVisible : true,
        onChange: (v) => updateSetting({ name: s.name, orbitVisible: v }),
      };
      polarLineCheckboxes[`${s.name}_pol`] = {
        label: s.name + " ",
        value: s.polarLineVisible || false,
        onChange: (v) => updateSetting({ name: s.name, polarLineVisible: v }),
      };
      orbitArrowsCheckboxes[`${s.name}_arr`] = {
        label: s.name + "  ",
        value: s.orbitArrowsVisible || false,
        onChange: (v) => updateSetting({ name: s.name, orbitArrowsVisible: v }),
      };
      filledOrbitsCheckboxes[`${s.name}_fil`] = {
        label: s.name + "   ",
        value: s.shadeOrbit || false,
        onChange: (v) => updateSetting({ name: s.name, shadeOrbit: v }),
      };
    }
  });

  return {
    "Planet sizes": {
      value: planetScale,
      min: 0.1,
      max: 5,
      step: 0.1,
      onChange: setPlanetScale,
    },
    "Show/Hide planets": folder(
      { ...planetVisibilityCheckboxes },
      { collapsed: true }
    ),
    "Polar lines": folder(
      {
        "Line length": {
          value: useStore.getState().polarLineSize,
          min: 5,
          max: 1000,
          step: 5,
          onChange: (v) => useStore.setState({ polarLineSize: v }),
        },
        ...polarLineCheckboxes,
      },
      { collapsed: true }
    ),
    "Orbits linewidth": {
      value: orbitsLineWidth,
      min: 0.5,
      max: 5,
      step: 0.5,
      onChange: setOrbitsLineWidth,
    },
    "Show/Hide orbits": folder(
      { ...orbitVisibilityCheckboxes },
      { collapsed: true }
    ),
    "Filled orbits": folder({ ...filledOrbitsCheckboxes }, { collapsed: true }),
    "Orbit arrows": folder(
      {
        Size: {
          value: globalArrowSize,
          min: 1,
          max: 10,
          step: 0.1,
          onChange: setGlobalArrowSize,
        },
        "No of Arrows": {
          value: globalArrowCount,
          min: 1,
          max: 24,
          step: 1,
          onChange: setGlobalArrowCount,
        },
        "Fixed size": {
          value: globalArrowFixedSize,
          onChange: setGlobalArrowFixedSize,
        },
        ...orbitArrowsCheckboxes,
      },
      { collapsed: true }
    ),
  };
};

export const useStarsHelpersConfig = () => {
  const {
    BSCStars,
    setBSCStars,
    searchStars,
    setSearchStars,
    starDistanceModifier,
    setStarDistanceModifier,
    officialStarDistances,
    setOfficialStarDistances,
    showConstellations,
    setShowConstellations,
    eclipticGrid,
    setEclipticGrid,
    zodiac,
    setZodiac,
    tropicalZodiac,
    setTropicalZodiac,
    hScale,
    sethScale,
  } = useStore();

  const setEquidistantStars = (value) => setOfficialStarDistances(!value);

  return {
    Stars: {
      value: BSCStars,
      onChange: (v) => {
        setBSCStars(v);
        setSearchStars(v ? true : false);
      },
    },
    "Divide distances by": {
      value: starDistanceModifier,
      min: 1,
      step: 100,
      onChange: setStarDistanceModifier,
    },
    "Celestial sphere": {
      value: false,
      min: 1,
      step: 100,
      onChange: setEquidistantStars,
    },
    Constellations: {
      value: showConstellations,
      onChange: setShowConstellations,
    },
    "Equinoxes & Solistices": {
      value: eclipticGrid,
      onChange: setEclipticGrid,
    },
    "Sidereal Zodiac": { value: zodiac, onChange: setZodiac },
    "Tropical Zodiac": { value: tropicalZodiac, onChange: setTropicalZodiac },
    "Sphere & Zodiac size": {
      value: hScale,
      min: 0.5,
      max: 100,
      step: 0.5,
      onChange: sethScale,
    },
  };
};
