// src/TSNext.jsx
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
import PosController from "./components/PosController";
import Positions from "./components/Menus/Positions";
import Ephemerides from "./components/Ephemerides/Ephemerides";
import EphController from "./components/Ephemerides/EphController";
import EphemeridesResult from "./components/Ephemerides/EphemeridesResult";
import EphemeridesProgress from "./components/Ephemerides/EphemeridesProgress";
import EphemerisChecker from "./components/EphemerisChecker/EphemerisChecker";
import CheckerController from "./components/EphemerisChecker/CheckerController";
import Plot from "./components/Plot/Plot";
import Stars from "./components/Stars/Stars";
import LabeledStars from "./components/Stars/LabeledStars";
import BSCStarsH from "./components/Stars/BSCStarsHandler";
import ReferenceStars from "./components/Stars/ReferenceStars";
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
import PlanetCameraHelper from "./components/PlanetCamera/PlanetCameraHelper";
import { VideoCanvas } from "./components/Recorder/r3f-video-recorder";
import RecorderMenu from "./components/Menus/RecorderMenu";
import RecorderController from "./components/Recorder/RecorderController";

const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

const TSNext = () => {
  const [canvasVisible, setCanvasVisible] = useState(false);

  const runIntro = useStore((s) => s.runIntro);
  const toggleShowMenu = useStore((s) => s.toggleShowMenu);
  const toggleShowLevaMenu = useStore((s) => s.toggleShowLevaMenu);
  const BSCStarsOn = useStore((s) => s.BSCStars);
  const refStarsOn = useStore((s) => s.refStars);
  const searchStars = useStore((s) => s.searchStars);
  const planetCamera = useStore((s) => s.planetCamera);
  const cameraTransitioning = useStore((s) => s.cameraTransitioning);
  const showPerf = useStore((s) => s.showPerf);

  const isTouchDev = isTouchDevice();

  useEffect(() => {
    if (isTouchDevice()) {
      toggleShowMenu();
      toggleShowLevaMenu();
    }
  }, []);

  const getCanvasStyle = () => {
    if (!runIntro) {
      return {
        opacity: 1,
        transition: "none",
      };
    }
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
        <EphemerisChecker />
        <Plot />
        <EditSettings />
        <PlanetCameraUI />
        <StarDataPanel />
        <PlanetCameraCompass />
        <Help />
        <RecorderMenu />
        {BSCStarsOn && !isTouchDev && searchStars && <StarSearch />}
      </div>
      <VideoCanvas
        id="canvas"
        frameloop="always"
        fps={60}
        dpr={[1, 2]} // FIX 1: Boost max pixel ratio to 2 for crisp Retina/High-DPI rendering
        gl={{
          antialias: true, // FIX 2: Explicitly request hardware anti-aliasing
          samples: 8, // FIX 3: Force maximum MSAA samples (supported in WebGL2)
          logarithmicDepthBuffer: true, // Necessary for solar system scale, but can conflict with AA on older GPUs
          preserveDrawingBuffer: true,
        }}
        style={getCanvasStyle()}
        raycaster={{
          params: { Line: { threshold: 0.1 } },
        }}
        onCreated={() => setCanvasVisible(true)}
      >
        <RecorderController />
        <IntroQuote />

        <Suspense fallback={null}>
          <OrbitCamera />
          {planetCamera && !cameraTransitioning && <PlanetCamera />}
          <TransitionCamera />

          <FocusSearchedStar />
          <IntroText />
          <AnimationController />
          <PosController />
          <TraceController />
          <EphController />
          <CheckerController />
          <LightEffectsMenu />
          <SolarSystem />
          <PlotSolarSystem />
          <Stars />
          <LabeledStars />
          {BSCStarsOn && <BSCStarsH />}
          {BSCStarsOn && !isTouchDev && <HighlightSelectedStar />}
          {refStarsOn && <ReferenceStars />}
          <Zodiac />
          <Constellations />
          <PlanetCameraHelper />
        </Suspense>
      </VideoCanvas>
    </>
  );
};

export default TSNext;
