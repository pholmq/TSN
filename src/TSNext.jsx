import "./index.css";
import { useEffect, Suspense, useState } from "react";
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
import IntroQuote from "./components/Intro/IntroQuote";
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

// Component that signals when Suspense is complete
const SuspenseCompleteSignal = ({ onComplete }) => {
  useEffect(() => {
    // Small delay to ensure all components are fully mounted
    const timer = setTimeout(() => {
      onComplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return null;
};

const TSNext = () => {
  const [canvasVisible, setCanvasVisible] = useState(false);

  // Get runIntro state from store
  const runIntro = useStore((s) => s.runIntro);

  const toggleShowMenu = useStore((s) => s.toggleShowMenu);
  const toggleShowLevaMenu = useStore((s) => s.toggleShowLevaMenu);
  const BSCStarsOn = useStore((s) => s.BSCStars);
  const searchStars = useStore((s) => s.searchStars);

  const isTouchDev = isTouchDevice();

  useEffect(() => {
    if (isTouchDevice()) {
      toggleShowMenu();
      toggleShowLevaMenu();
    }
  }, []);

  const handleSuspenseComplete = () => {
    setCanvasVisible(true);
  };

  // Calculate canvas opacity and transition based on runIntro state
  const getCanvasStyle = () => {
    if (!runIntro) {
      // If intro is interrupted, immediately show canvas with no transition
      return {
        opacity: 1,
        transition: "none",
      };
    }
    // Otherwise, use the canvasVisible state for the fade-in effect
    return {
      opacity: canvasVisible ? 1 : 0,
      transition: "opacity 5s ease-in-out",
    };
  };

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
        {BSCStarsOn && !isTouchDev && searchStars && <StarSearch />}
      </div>
      <Canvas
        id="canvas"
        frameloop="demand"
        gl={{ logarithmicDepthBuffer: true }}
        style={getCanvasStyle()}
      >
        {/* IntroQuote is always rendered and visible */}
        <IntroQuote />

        {/* Other components wrapped in Suspense */}
        <Suspense fallback={null}>
          <SuspenseCompleteSignal onComplete={handleSuspenseComplete} />
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
          {BSCStarsOn && !isTouchDev && <HighlightSelectedStar />}
          <Zodiac />
        </Suspense>
      </Canvas>
    </>
  );
};

export default TSNext;
