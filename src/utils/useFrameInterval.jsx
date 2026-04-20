import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const useFrameInterval = (fn, delay = 10) => {
  const timer = useRef(0);
  const delayInSeconds = delay / 1000;

  useFrame((state, delta) => {
    timer.current += delta;

    if (timer.current >= delayInSeconds) {
      fn(state);
      // Retain the remainder to prevent drift over time
      timer.current %= delayInSeconds;
    }
  });
};

export default useFrameInterval;
