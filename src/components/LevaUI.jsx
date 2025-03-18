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
    starDistanceModifier,
    setStarDistanceModifier,
    officialStarDistances,
    setOfficialStarDistances,
    starScale,
    setStarScale
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
    traceOn1: {
      label: "Trace On/Off",
      value: trace,
      onChange: (v) => {
        setTrace(v);
        // set2({ traceOn2: v });
      },
    },
  "Show positions": {
      value: showPositions,
      hint: "Keep unchecked for best performance",
      onChange: setShowPositions,
    },
  Camera: folder(
      { Follow: { value: cameraFollow, onChange: setCameraFollow }, "Planet camera":{value: planetCamera, onChange: setPlanetCamera} },
      { collapsed: true }
    ),

    Trace: folder(
      {
        // traceOn2: {
        //   label: "Trace On/Off",
        //   value: trace,
        //   onChange: (v) => {
        //     setTrace(v);
        //     set1({ traceOn1: v });
        //   },
        // },
        // "Update interval": {
        //   value: useTraceStore.getState().interval,
        //   min: 0,
        //   max: 900,
        //   step:10,
        //   onChange: (v) => useTraceStore.setState({ interval: v }),
        // },
        "Line width": {
          value: lineWidth,
          min: 1,
          max: 10,
          step: 1,
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
        "Show Orbits": {
          value: orbits,
          onChange: setOrbits,
        },
        "Orbits linewidth": {
          value: orbitsLineWidth,
          min: 1,
          max: 10,
          step: 1,
          onChange: setOrbitsLineWidth,
        },
        "Planet sizes": {
          value: planetScale,
          min: 0.1,
          max: 5,
          step: 0.1,
          onChange: setPlanetScale,
        },
        "Actual planet sizes": {
          value: actualPlanetSizes,
          onChange: setActualPlanetSizes,
        },
        Arrows: {
          value: arrows,
          onChange: setArrows,
        },
      },
      { collapsed: true }
    ),
    "Stars & Helpers": folder(
      {
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
