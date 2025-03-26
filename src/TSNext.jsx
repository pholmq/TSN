import "./index.css";

import { Canvas } from "@react-three/fiber";
import { useStore } from "./store";
import UserInterface from "./components/UserInterface";
import OrbitCamera from "./components/OrbitCamera";
import AnimationController from "./components/AnimationController";
import SolarSystem from "./components/SolarSystem";
import PlotSolarSystem from "./components/PlotSolarSystem";
import TraceController from "./components/Trace/TraceController";
import LightEffectsMenu from "./components/Menus/LightEffectsMenu";
import PlanetsOrbitsMenu from "./components/Menus/PlanetsOrbitsMenu";
import StarsHelpersMenu from "./components/Menus/StarsHelpersMenu";
import PosController from "./components/PosController";
import InfoPanel from "./components/InfoPanel";
import Positions from "./components/Positions";
import Stars from "./components/Stars/Stars";
import Zodiac from "./components/Helpers/Zodiac"

const TSNext = () => {
  const zoomLevel = useStore((s) => s.zoomLevel);

  return (
    <>
      <div >
        <UserInterface />

        {/* <InfoPanel /> */}
        <Positions />
      </div>
      <Canvas         
        frameloop="demand"
      >
        <OrbitCamera />
        <AnimationController />
        <PosController />
        <TraceController />
        <PlanetsOrbitsMenu />
        <StarsHelpersMenu/>
        <LightEffectsMenu />
        <SolarSystem />
        <PlotSolarSystem />
        <Stars/>
        <Zodiac/>
      </Canvas>
    </>
  );
};

export default TSNext;
