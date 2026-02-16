// LightEffectsMenu.js
import { useEffect } from "react";
import { Stats } from "@react-three/drei";
import { Perf } from "r3f-perf";

import {
  EffectComposer,
  Bloom,
  SelectiveBloom,
  FXAA,
  SMAA,
} from "@react-three/postprocessing";
import { useControls, folder } from "leva";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "../PlanetCamera/planetCameraStore";

const LightEffectsMenu = () => {
  const zoomLevel = useStore((state) => state.zoomLevel);
  const setZoom = useStore((state) => state.setZoom);

  const { ambientLight, glow, glowIntensity, antialiasing, stats } =
    useControls("Settings", {
      "UI & Labels size": {
        value: zoomLevel,
        min: 60,
        max: 120,
        step: 1,
        onChange: (v) => setZoom(v),
      },
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
        value: 0.2,
        min: 0.1,
        max: 2,
        step: 0.1,
        hint: "Glow can affect performance",
      },

      "developer settings": folder(
        {
          antialiasing: {
            label: "Anti-Aliasing",
            value: "SMAA",
            options: ["FXAA", "SMAA", "None"],
          },
          stats: {
            value: false,
            label: "Show FPS",
          },
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
            value: usePlanetCameraStore.getState().groundSize,
            min: 1,
            step: 1,
            onChange: (v) => usePlanetCameraStore.setState({ groundSize: v }),
          },
          "Ground height": {
            value: usePlanetCameraStore.getState().groundHeight,
            min: 0.1,
            step: 0.1,
            onChange: (v) => usePlanetCameraStore.setState({ groundHeight: v }),
          },
          "Show planet camera position": {
            value: useStore.getState().planetCameraHelper,
            onChange: (v) => useStore.setState({ planetCameraHelper: v }),
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
      {stats && (
        <Perf
          position="top-left"
          style={{
            transform: "scale(2)",
            transformOrigin: "top left",
            zIndex: 9999,
            top: "10px",
            left: "10px",
          }}
        />
      )}
    </>
  );
};

export default LightEffectsMenu;
