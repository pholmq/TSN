import { useRef, useEffect } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useTraceStore, useSettingsStore } from "../store";
import { speedFactOpts } from "../utils/time-date-functions";

const LevaUI = () => {
  const levaStore = useCreateStore();
  const {
    showLevaMenu,
    speedMultiplier,
    setSpeedMultiplier,
    speedFact,
    setSpeedFact,
    cameraFollow,
    setCameraFollow,
    planetCamera,
    setPlanetCamera,
    orbits,
    setOrbits,
    arrows,
    setArrows,
    orbitsLineWidth,
    setOrbitsLineWidth,
    planetScale,
    setPlanetScale,
    actualPlanetSizes,
    setActualPlanetSizes,
    showPositions,
    setShowPositions,
    zodiac,
    setZodiac,
    zodiacSize,
    setZodiacSize,
    tropicalZodiac,
    setTropicalZodiac,
    southLine,
    setSouthLine,
    celestialSphere,
    setCelestialSphere,
    celestialSphereSize,
    setCelestialSphereSize,
    eclipticGrid,
    setEclipticGrid,
    eclipticGridSize,
    setEclipticGridSize,
    starDistanceModifier,
    setStarDistanceModifier,
    officialStarDistances,
    setOfficialStarDistances,
    starScale,
    setStarScale,
    showLabels,
    setShowLables,
    geoSphere,
    setGeoSphere,
    ephimerides,
    setEphemerides,
    plot,
    setPlot,
    BSCStars,
    setBSCStars,
    hScale,
    sethScale,
    searchStars,
    setSearchStars,
    cameraTransitioning,
    showConstellations,
    setShowConstellations,
  } = useStore();

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

  const setEquidistantStars = (value) => {
    setOfficialStarDistances(!value);
  };

  const polarLineCheckboxes = {};
  settings.forEach((s) => {
    if (s.type === "planet") {
      polarLineCheckboxes[s.name] = {
        value: s.polarLineVisible || false,
        onChange: (v) => {
          // FIX: Only send the specific field that changed to prevent overwriting
          updateSetting({ name: s.name, polarLineVisible: v });
        },
      };
    }
  });

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
    Controls: folder(
      {
        "Actual planet sizes": {
          value: actualPlanetSizes,
          onChange: setActualPlanetSizes,
        },
        "Planet camera": {
          value: planetCamera,
          onChange: setPlanetCamera,
        },
        "Camera follow": { value: cameraFollow, onChange: setCameraFollow },
        Labels: {
          value: showLabels,
          onChange: setShowLables,
        },
        Orbits: {
          value: orbits,
          onChange: setOrbits,
        },
        Search: {
          value: searchStars,
          onChange: setSearchStars,
        },
        Positions: {
          value: showPositions,
          hint: "Keep unchecked for best performance",
          onChange: setShowPositions,
        },
        Ephemerides: {
          value: ephimerides,
          onChange: setEphemerides,
        },
      },
      { collapsed: false }
    ),

    Trace: folder(
      {
        TraceOnOff: {
          label: "Trace On/Off",
          value: trace,
          onChange: setTrace,
        },
        "Line width": {
          value: lineWidth,
          min: 0.5,
          max: 5,
          step: 0.5,
          onChange: setLineWidth,
        },
        "Dotted line": {
          value: dotted,
          onChange: setDotted,
        },
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
      },
      { collapsed: true }
    ),
    "Planets & Orbits": folder(
      {
        "Planet sizes": {
          value: planetScale,
          min: 0.1,
          max: 5,
          step: 0.1,
          onChange: setPlanetScale,
        },
        "Orbits linewidth": {
          value: orbitsLineWidth,
          min: 0.5,
          max: 5,
          step: 0.5,
          onChange: setOrbitsLineWidth,
        },
        Arrows: {
          value: arrows,
          onChange: setArrows,
        },
        "Polar lines": folder(polarLineCheckboxes, { collapsed: true }),
        Graticules: {
          value: geoSphere,
          onChange: setGeoSphere,
        },
      },
      { collapsed: true }
    ),
    "Stars & Helpers": folder(
      {
        Stars: {
          value: BSCStars,
          onChange: (v) => {
            setBSCStars(v);
            if (!v) {
              setSearchStars(false);
            } else {
              setSearchStars(true);
            }
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
        "Sidereal Zodiac": {
          value: zodiac,
          onChange: setZodiac,
        },
        "Tropical Zodiac": {
          value: tropicalZodiac,
          onChange: setTropicalZodiac,
        },
        "Sphere & Zodiac size": {
          value: hScale,
          min: 0.5,
          max: 100,
          step: 0.5,
          onChange: sethScale,
        },
      },
      { collapsed: true }
    ),
    Settings: folder({}, { collapsed: true }),
  }));

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
    if (planetCamera) {
      setActualPlanetSizes(true);
    } else {
      setActualPlanetSizes(false);
    }
  }, [planetCamera]);

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
  }, [planetCamera, cameraTransitioning]);

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
