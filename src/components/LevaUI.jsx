import { useState } from "react";
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

  // const toggleTrace = () => {
  //   useTraceStore.setState({ trace: !traceOnOff });
  //   setTraceOnOff(!traceOnOff);
  // };

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
        Trace: {
          label: "Trace On/Off",
          value: trace,
          onChange: setTrace,
        },
        "Actual planet sizes": {
          value: actualPlanetSizes,
          onChange: setActualPlanetSizes,
        },
        "Planet camera": {
          value: planetCameraHelper,
          onChange: setPlanetCameraHelper,
        },
        "Show positions": {
          value: showPositions,
          hint: "Keep unchecked for best performance",
          onChange: setShowPositions,
        },
        "Camera follow": { value: cameraFollow, onChange: setCameraFollow },
      },
      { collapsed: false }
    ),

    "Trace settings": folder(
      {
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
        "Show Orbits": {
          value: orbits,
          onChange: setOrbits,
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
        "Edit settings": {
          value: editSettings,
          onChange: setEditSettings,
        },
      },
      { collapsed: true }
    ),
    "Stars & Helpers": folder(
      {
        Zodiac: {
          value: zodiac,
          onChange: setZodiac,
        },
        "Zodiac size": {
          value: zodiacSize,
          min: 0.1,
          max: 5,
          step: 0.1,
          onChange: setZodiacSize,
        },
        "Polar line": {
          value: polarLine,
          onChange: setPolarLine,
        },
        "South line": {
          value: southLine,
          onChange: setSouthLine,
        },
        "Line length": {
          value: polarLineSize,
          min: 5,
          step: 1,
          onChange: setPolarLineSize,
        },
        "Celestial sphere": {
          value: celestialSphere,
          onChange: setCelestialSphere,
        },
        "Sphere size": {
          value: celestialSphereSize,
          min: 5,
          step: 1,
          onChange: setCelestialSphereSize,
        },
        "Ecliptic grid": {
          value: eclipticGrid,
          onChange: setEclipticGrid,
        },
        "Grid size": {
          value: eclipticGridSize,
          min: 5,
          step: 1,
          onChange: setEclipticGridSize,
        },

        "Use star distances": {
          value: officialStarDistances,
          onChange: setOfficialStarDistances,
        },
        "Divide distances by": {
          value: starDistanceModifier,
          min: 1,
          step: 100,
          onChange: setStarDistanceModifier,
        },
        "Star sizes": {
          value: starScale,
          min: 0.1,
          max: 5,
          step: 0.1,
          onChange: setStarScale,
        },
        "Show labels": {
          value: showLabels,
          onChange: setShowLables,
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

  return (
    <>
      <Leva
        store={levaStore}
        fill
        titleBar={false}
        hideCopyButton
        theme={{
          fontSizes: {
            root: "16px",
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
              root: "16px",
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
