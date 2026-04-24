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
import { useCheckerStore } from "../EphemerisChecker/checkerStore";

const LightEffectsMenu = () => {
  const zoomLevel = useStore((state) => state.zoomLevel);
  const setZoom = useStore((state) => state.setZoom);
  const runIntro = useStore((s) => s.runIntro);
  const setRunIntro = useStore((s) => s.setRunIntro);

  const refStars = useStore((s) => s.refStars);
  const setRefStars = useStore((s) => s.setRefStars);

  const editSettings = useStore((s) => s.editSettings);
  const setEditSettings = useStore((s) => s.setEditSettings);

  const showSpeeds = useStore((state) => state.showSpeeds);
  const setShowSpeeds = useStore((state) => state.setShowSpeeds);

  const showChecker = useCheckerStore((s) => s.showChecker);
  const setShowChecker = useCheckerStore((s) => s.setShowChecker);

  // Separate controls and the set function so we can update Leva externally
  const [controls, setControls] = useControls("Settings", () => ({
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

    "Developer menu": folder(
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
        "Show Intro": {
          value: runIntro,
          onChange: (v) => setRunIntro(v),
        },
        "Video Recorder": {
          value: useStore.getState().showRecorder,
          onChange: (v) => useStore.setState({ showRecorder: v }),
        },
        "Reference Stars": {
          value: refStars,
          onChange: setRefStars,
        },
        "Ephemeris Checker": {
          value: showChecker,
          onChange: (v, path, context) => {
            if (context?.initial) return;
            setShowChecker(v);
          },
        },
        "Edit settings": {
          value: editSettings,
          onChange: (v, path, context) => {
            // FIX: Ignore Leva's automatic mount sync so it doesn't overwrite state
            if (context?.initial) return;
            setEditSettings(v);
          },
        },

        "Show Speeds": {
          value: showSpeeds,
          onChange: (v) => setShowSpeeds(v),
        },
      },
      { collapsed: false }
    ),
  }));

  // Keep the destructured variables working for the return block
  const { ambientLight, glow, glowIntensity, antialiasing, stats } = controls;

  // FIX: Sync Leva visually if components are turned off externally (like clicking the "✕" button)
  useEffect(() => {
    setControls({
      "Edit settings": editSettings,
      "Ephemeris Checker": showChecker,
    });
  }, [editSettings, showChecker, setControls]);

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
