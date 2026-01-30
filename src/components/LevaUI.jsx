import { useRef, useEffect } from "react";
import { useControls, useCreateStore, Leva, folder, levaStore } from "leva";
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
    planetCameraHelper,
    setPlanetCameraHelper,
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
    polarLine,
    setPolarLine,
    polarLineSize,
    setPolarLineSize,
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
    editSettings,
    setEditSettings,
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
    // Add Constellations
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

  const setEquidistantStars = (value) => {
    setOfficialStarDistances(!value);
  };

  //We use a spearate levaStore for the first items so we can hide the rest of the
  //Leva UI when showLevaMenu is false
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

  //Some of these hese folders are populated by other components, but to get them in the correct
  //order we create them here

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
        // "Show planet camera position": {
        //   value: planetCameraHelper,
        //   onChange: setPlanetCameraHelper,
        // },
        "Camera follow": { value: cameraFollow, onChange: setCameraFollow },
        Labels: {
          value: showLabels,
          onChange: setShowLables,
        },
        Orbits: {
          value: orbits,
          onChange: setOrbits,
        },
        "Star Search": {
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
        // Plot: {
        //   value: plot,
        //   onChange: (v) => {
        //     setPlot(v);
        //   },
        // },
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
        // Moved here:
        "Polar lines": {
          value: polarLine,
          onChange: setPolarLine,
        },
        Graticules: {
          value: geoSphere,
          onChange: setGeoSphere,
        },
        "Edit settings": {
          value: editSettings,
          onChange: setEditSettings,
        },
      },
      { collapsed: true }
    ),
    "Stars & Helpers": folder(
      {
        // Moved to the top of "Stars & Helpers"
        "BSC Stars": {
          value: BSCStars,
          onChange: setBSCStars,
        },
        // "Use star distances": {
        //   value: officialStarDistances,
        //   onChange: setOfficialStarDistances,
        // },

        "Divide distances by": {
          value: starDistanceModifier,
          min: 1,
          step: 100,
          onChange: setStarDistanceModifier,
        },
        //Renamed equdistant stars to Celestial sphere in the meny. Easier to understand.
        "Celestial sphere": {
          value: false,
          min: 1,
          step: 100,
          onChange: setEquidistantStars,
        },
        // Added Constellations here
        Constellations: {
          value: showConstellations,
          onChange: setShowConstellations,
        },
        "Celestial grid": {
          value: celestialSphere,
          onChange: setCelestialSphere,
        },
        "Ecliptic grid": {
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
        "Sphere/Grid/Zodiac size": {
          value: hScale,
          min: 0.5,
          max: 100,
          step: 0.5,
          onChange: sethScale,
        },
      },
      { collapsed: true }
    ),
    "Light & Effects": folder(
      {},
      //Populated in LightEffectsMenu
      { collapsed: true }
    ),
  }));

  useEffect(() => {
    // Only update actualPlanetSizes in the UI, don't touch planetCamera
    set2({
      "Actual planet sizes": actualPlanetSizes,
      Orbits: orbits,
    });
  }, [actualPlanetSizes, orbits, set2]);

  const prevTransitioningRef = useRef(false);
  useEffect(() => {
    // Change actual planet sizes immediately when planet camera is checked
    if (planetCamera) {
      setActualPlanetSizes(true);
    } else {
      setActualPlanetSizes(false);
    }
  }, [planetCamera]);

  useEffect(() => {
    // Detect when transition completes (was true, now false)
    if (
      prevTransitioningRef.current === true &&
      cameraTransitioning === false &&
      planetCamera
    ) {
      setOrbits(false);
    }

    // Restore orbits when exiting planet camera
    if (!planetCamera) {
      setOrbits(true);
    }

    // Update ref for next render
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
          fontSizes: {
            root: "12px",
          },
          fonts: {
            mono: "",
          },
          colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
        }}
      />
      {/* TODO: Sort out the scollbar apperance so that it appears
      and you can scroll through the entire leva menu */}
      <div
        hidden={!showLevaMenu}
        style={{ maxHeight: "80vh", overflow: "auto" }}
      >
        <Leva
          fill
          titleBar={false}
          hideCopyButton
          theme={{
            fontSizes: {
              root: "12px",
            },
            fonts: {
              mono: "",
            },
            colors: { highlight1: "#FFFFFF", highlight2: "#FFFFFF" },
          }}
        />
      </div>
    </>
  );
};

export default LevaUI;
