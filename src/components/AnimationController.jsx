import { useStore } from "../store";
import { useFrame, useThree } from "@react-three/fiber";
import { useVideoCanvas } from "./Recorder/r3f-video-recorder";

//Note: UserInterface handles most of this but we need to have the useFrame hook
//within the canvas component

const AnimationController = () => {
  useStore((s) => s.updAC); //Triggers a rerender when needed

  const videoCanvas = useVideoCanvas(); // Tap into the deterministic clock

  const { invalidate, clock } = useThree();
  const posRef = useStore((s) => s.posRef);
  if (posRef.current == null) posRef.current = 0;
  const run = useStore((s) => s.run);
  const speedFact = useStore((s) => s.speedFact);
  const speedMultiplier = useStore((s) => s.speedMultiplier);

  // Priority -1 ensures this runs BEFORE components (like planets) read the position
  useFrame((state, delta) => {
    // If actively recording, force a perfect frame step. Otherwise, use real hardware delta.
    const isRecording = videoCanvas?.recording !== null;
    const activeDelta = isRecording ? 1 / videoCanvas.fps : delta;

    if (run) {
      posRef.current =
        posRef.current + activeDelta * (speedFact * speedMultiplier);
    }
  }, -1);
  return null;
};

export default AnimationController;
