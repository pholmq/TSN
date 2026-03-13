import { useStore } from "../store";
import { useFrame } from "@react-three/fiber";
import { useVideoCanvas } from "./Recorder/r3f-video-recorder";

const AnimationController = () => {
  const videoCanvas = useVideoCanvas(); // Tap into the deterministic clock
  const posRef = useStore((s) => s.posRef);

  // Initialize the ref safely once
  if (posRef.current == null) posRef.current = 0;

  // Priority -1 ensures this runs BEFORE components (like planets) read the position
  useFrame((state, delta) => {
    // OPTIMIZATION: Read state imperatively.
    // This completely eliminates React re-renders when the user adjusts the speed slider or plays/pauses.
    const { run, speedFact, speedMultiplier } = useStore.getState();

    if (!run) return;

    // If actively recording, force a perfect frame step. Otherwise, use real hardware delta.
    const isRecording = videoCanvas?.recording !== null;
    const activeDelta = isRecording ? 1 / (videoCanvas.fps || 60) : delta;

    posRef.current += activeDelta * (speedFact * speedMultiplier);
  }, -1);

  return null;
};

export default AnimationController;
