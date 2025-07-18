import "./index.css";
import { useEffect } from "react";
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
import Positions from "./components/Menus/Positions";
import Stars from "./components/Stars/Stars";
// import BSCStars from "./components/Stars/BSCStars";
import BSCStarsH from "./components/Stars/BSCStarsHandler";
import Zodiac from "./components/Helpers/Zodiac";
import PlanetCamera from "./components/PlanetCamera/PlanetCamera";
import PlanetCameraUI from "./components/PlanetCamera/PlanetCameraUI";
import IntroText from "./components/Intro/IntroText";
import EditSettings from "./components/Menus/EditSettings";
import StarDataPanel from "./components/StarDataPanel/StarDataPanel";
import StarSearch from "./components/StarSearch/StarSearch";
import HighlightSelectedStar from "./components/StarSearch/HighlightSelectedStar";

const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

const TSNext = () => {
  // const zoomLevel = useStore((s) => s.zoomLevel);
  const toggleShowMenu = useStore((s) => s.toggleShowMenu);
  const toggleShowLevaMenu = useStore((s) => s.toggleShowLevaMenu);
  const BSCStarsOn = useStore((s) => s.BSCStars);

  const isTouchDev = isTouchDevice();

  useEffect(() => {
    if (isTouchDevice()) {
      toggleShowMenu();
      toggleShowLevaMenu();
    }
  }, []);

  return (
    <>
      <div>
        <UserInterface />
        <Positions />
        <EditSettings />
        <PlanetCameraUI />
        <StarDataPanel />
        {BSCStarsOn && !isTouchDev && <StarSearch />}
      </div>
      <Canvas
        id="canvas"
        frameloop="demand"
        gl={{ logarithmicDepthBuffer: true }} //Fixes depth buffer issues due to extreme Camera far
      >
        <OrbitCamera />
        <PlanetCamera />
        <IntroText />
        <AnimationController />
        <PosController />
        <TraceController />
        <PlanetsPositionsMenu />
        <StarsHelpersMenu />
        <LightEffectsMenu />
        <SolarSystem />
        <PlotSolarSystem />
        <Stars />
        {BSCStarsOn && <BSCStarsH />}
        {BSCStarsOn && <HighlightSelectedStar />}
        <Zodiac />
      </Canvas>
    </>
  );
};

export default TSNext;
