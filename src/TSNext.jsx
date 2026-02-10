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
import Ephemerides from "./components/Ephemerides/Ephemerides";
import EphController from "./components/Ephemerides/EphController";
import EphemeridesResult from "./components/Ephemerides/EphemeridesResult";
import EphemeridesProgress from "./components/Ephemerides/EphemeridesProgress";
import Plot from "./components/Plot/Plot";
// import PlotController from "./components/Plot/PlotController";
import Stars from "./components/Stars/Stars";
import LabeledStars from "./components/Stars/LabeledStars";
// import BSCStars from "./components/Stars/BSCStars";
import BSCStarsH from "./components/Stars/BSCStarsHandler";
import Zodiac from "./components/Helpers/Zodiac";
import PlanetCamera from "./components/PlanetCamera/PlanetCamera";
import PlanetCameraUI from "./components/PlanetCamera/PlanetCameraUI";
import FocusSearchedStar from "./components/PlanetCamera/FocusSearchedStar";
import IntroText from "./components/Intro/IntroText";
import IntroQuote from "./components/Intro/IntroQuote";
import EditSettings from "./components/Menus/EditSettings";
import StarDataPanel from "./components/StarDataPanel/StarDataPanel";
import StarSearch from "./components/StarSearch/StarSearch";
import HighlightSelectedStar from "./components/StarSearch/HighlightSelectedStar";
import Help from "./components/Help/Help";
import PlanetCameraCompass from "./components/PlanetCamera/PlanetCameraCompass";
import TransitionCamera from "./components/PlanetCamera/TransitionCamera";
import Constellations from "./components/Stars/Constellations";
import { Perf } from "r3f-perf";

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
  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);

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
        <Ephemerides />
        <EphemeridesResult />
        <EphemeridesProgress />
        <Plot />
        <EditSettings />
        <PlanetCameraUI />
        <StarDataPanel />
        <PlanetCameraCompass />
        <Help />
        {BSCStarsOn && !isTouchDev && searchStars && <StarSearch />}
      </div>
      <Canvas
        id="canvas"
        frameloop="always"
        gl={{ logarithmicDepthBuffer: true }}
        style={getCanvasStyle()}
      >
        {/* <Perf position="top-left" /> */}
        {/* IntroQuote is always rendered and visible */}
        <IntroQuote />

        {/* Other components wrapped in Suspense */}
        <Suspense fallback={null}>
          <SuspenseCompleteSignal onComplete={handleSuspenseComplete} />
          <OrbitCamera />
          {planetCamera && !cameraTransitioning && <PlanetCamera />}
          <TransitionCamera />

          <FocusSearchedStar />
          <IntroText />
          <AnimationController />
          <PosController />
          <TraceController />
          <EphController />
          {/* <PlotController /> */}
          <PlanetsPositionsMenu />
          <StarsHelpersMenu />
          <LightEffectsMenu />
          <SolarSystem />
          <PlotSolarSystem />
          <Stars />
          <LabeledStars />
          {BSCStarsOn && <BSCStarsH />}
          {BSCStarsOn && !isTouchDev && <HighlightSelectedStar />}
          <Zodiac />
          <Constellations />
        </Suspense>
      </Canvas>
    </>
  );
};

export default TSNext;
