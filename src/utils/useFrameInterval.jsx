import { useFrame, useThree } from "@react-three/fiber";

const useFrameInterval = (fn, delay = 10, invalidateFr = false) => {
  let start = performance.now();
  const { invalidate } = useThree();

  useFrame((state) => {
    let current = performance.now();
    let delta = current - start;

    if (delta >= delay) {
      // Since we have frameloop=demand we sometimes need to force a redraw
      if (invalidateFr) invalidate();

      // Pass the state (camera, scene, etc.) to the callback function
      fn(state);

      start = performance.now();
    }
  });
};

export default useFrameInterval;
