import "./index.css";
import { useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
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
import BSCStarsH from "./components/Stars/BSCStarsHandler";
import Zodiac from "./components/Helpers/Zodiac";
import PlanetCamera from "./components/PlanetCamera/PlanetCamera";
import PlanetCameraUI from "./components/PlanetCamera/PlanetCameraUI";
import IntroText from "./components/Intro/IntroText";
import EditSettings from "./components/Menus/EditSettings";
import StarDataPanel from "./components/StarDataPanel/StarDataPanel";
import StarSearch from "./components/StarSearch/StarSearch";
import HighlightSelectedStar from "./components/StarSearch/HighlightSelectedStar";
import Help from "./components/Help/Help";
import PlanetCameraCompass from "./components/PlanetCamera/PlanetCameraCompass";

const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

// Loading component that shows while resources are loading
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: "white",
          fontSize: "18px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          background: "rgba(0,0,0,0.8)",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <div>Loading TYCHOSIUM...</div>
        <div style={{ marginTop: "10px", fontSize: "14px" }}>
          {progress.toFixed(0)}%
        </div>
        <div
          style={{
            width: "200px",
            height: "4px",
            background: "#333",
            borderRadius: "2px",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "white",
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    </Html>
  );
}

// Main scene component wrapped in Suspense
function Scene() {
  const BSCStarsOn = useStore((s) => s.BSCStars);
  const isTouchDev = isTouchDevice();

  return (
    <>
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
    </>
  );
}

const TSNext = () => {
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
        <PlanetCameraCompass />
        <Help />
        {BSCStarsOn && !isTouchDev && <StarSearch />}
      </div>
      <Canvas
        id="canvas"
        frameloop="demand"
        gl={{ logarithmicDepthBuffer: true }}
      >
        <Suspense fallback={<Loader />}>
          <Scene />
        </Suspense>
      </Canvas>
    </>
  );
};

export default TSNext;
