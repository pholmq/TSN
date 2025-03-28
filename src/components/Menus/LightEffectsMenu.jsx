// LightEffectsMenu.js
import {useEffect} from "react";
import { Stats } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  SelectiveBloom,
  FXAA,
  SMAA,
} from "@react-three/postprocessing";
import { useControls } from "leva";
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
        value: false,
        hint: "Glow can affect performance",
      },
      glowIntensity: {
        label: "Glow strength",
        value: 2,
        min: 1,
        max: 10,
        step: 1,
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