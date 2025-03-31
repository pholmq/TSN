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
import PlanetsPositionsMenu from "./components/Menus/PlanetsPositionsMenu";
import StarsHelpersMenu from "./components/Menus/StarsHelpersMenu";
import PosController from "./components/PosController";
import Positions from "./components/Positions";
import Stars from "./components/Stars/Stars";
import Zodiac from "./components/Helpers/Zodiac";
import PlanetCamera from "./components/PlanetCamera/PlanetCamera";
import PlanetCameraUI from "./components/PlanetCamera/PlanetCameraUI";

const TSNext = () => {
  const zoomLevel = useStore((s) => s.zoomLevel);

  return (
    <>
      <div>
        <UserInterface />

        {/* <InfoPanel /> */}
        <Positions />
        <PlanetCameraUI />
      </div>
      <Canvas
        frameloop="demand"
        gl={{ logarithmicDepthBuffer: true }} //Fixes depth buffer issues due to extreme Camera far
      >
        <OrbitCamera />
        <PlanetCamera />
        <AnimationController />
        <PosController />
        <TraceController />
        <PlanetsPositionsMenu />
        <StarsHelpersMenu />
        <LightEffectsMenu />
        <SolarSystem />
        <PlotSolarSystem />
        <Stars />
        <Zodiac />
      </Canvas>
    </>
  );
};

export default TSNext;
