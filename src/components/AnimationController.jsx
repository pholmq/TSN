import { useStore } from "../store";
import { useFrame, useThree } from "@react-three/fiber";

//Note: UserInterface handles most of this but we need to have the useFrame hook
//within the canvas component

const AnimationController = () => {
  useStore((s) => s.updAC); //Triggers a rerender when needed

  const { invalidate, clock } = useThree();
  const posRef = useStore((s) => s.posRef);
  if (posRef.current == null) posRef.current = 0;
  const run = useStore((s) => s.run);
  const speedFact = useStore((s) => s.speedFact);
  const speedMultiplier = useStore((s) => s.speedMultiplier);
  invalidate();
  clock.getDelta(); //Reset delta so that it's 0 when run becomes true
  useFrame((state, delta) => {
    if (run) {
      posRef.current = posRef.current + delta * (speedFact * speedMultiplier);
      invalidate(); //Ivalidate frame so we get a render since we have frameloop=demand
    }
  });
  return null;
};

export default AnimationController;
