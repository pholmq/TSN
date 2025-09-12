// LightEffectsMenu.js
import { useEffect } from "react";
import { Stats } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  SelectiveBloom,
  FXAA,
  SMAA,
} from "@react-three/postprocessing";
import { useControls, folder } from "leva";
import { useStore } from "../../store";

const LightEffectsMenu = () => {
  const { ambientLight, glow, glowIntensity, antialiasing, stats } =
    useControls("Light & Effects", {
      ambientLight: {
        label: "Ambient light",
        value: 1,
        min: 0,
        max: 5,
        step: 0.1,
      },
      sunLight: {
        label: "Sunlight",
        value: useStore.getState().sunLight,
        min: 0,
        max: 5,
        step: 0.1,
        onChange: (v) => useStore.setState({ sunLight: v }),
      },
      glow: {
        label: "Glow",
        value: true,
        hint: "Glow can affect performance",
      },
      glowIntensity: {
        label: "Glow strength",
        value: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        hint: "Glow can affect performance",
      },
      antialiasing: {
        label: "Anti-Aliasing",
        value: "SMAA",
        options: ["FXAA", "SMAA", "None"],
      },
      stats: {
        value: false,
        label: "Show FPS",
      },
      Settings: folder(
        {
          "Star sizes": {
            value: useStore.getState().starScale,
            min: 0.1,
            max: 5,
            step: 0.1,
            onChange: (v) => useStore.setState({ starScale: v }),
          },
          "Zodiac size": {
            value: useStore.getState().zodiacSize,
            min: 1,
            step: 1,
            onChange: (v) => useStore.setState({ zodiacSize: v }),
          },
          "Polar line length": {
            value: useStore.getState().polarLineSize,
            min: 5,
            step: 1,
            onChange: (v) => useStore.setState({ polarLineSize: v }),
          },
          "Celestial sphere size": {
            value: useStore.getState().celestialSphereSize,
            min: 5,
            step: 1,
            onChange: (v) => useStore.setState({ celestialSphereSize: v }),
          },
          "Ecliptic grid size": {
            value: useStore.getState().eclipticGridSize,
            min: 5,
            step: 1,
            onChange: (v) => useStore.setState({ eclipticGridSize: v }),
          },
          "Ground size": {
            value: useStore.getState().groundSize,
            min: 5,
            step: 1,
            onChange: (v) => useStore.setState({ groundSize: v }),
          },
          "Ground height": {
            value: useStore.getState().groundHeight,
            min: 5,
            step: 1,
            onChange: (v) => useStore.setState({ groundHeight: v }),
          },
        },
        { collapsed: true }
      ),
    });

  return (
    <>
      <ambientLight intensity={ambientLight} />

      <EffectComposer multisampling={0}>
        {antialiasing === "FXAA" && <FXAA />}
        {antialiasing === "SMAA" && <SMAA />}
        {glow && <Bloom luminanceThreshold={0} intensity={glowIntensity / 2} />}
      </EffectComposer>
      {stats && <Stats />}
    </>
  );
};

export default LightEffectsMenu;
