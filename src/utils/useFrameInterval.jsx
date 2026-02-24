import { useFrame, useThree } from "@react-three/fiber";

const useFrameInterval = (fn, delay = 10, invalidateFr = false) => {
  let start = performance.now();
  const { invalidate } = useThree();

  useFrame((state) => {
    let current = performance.now();
    let delta = current - start;

    if (delta >= delay) {
      // Pass the state (camera, scene, etc.) to the callback function
      fn(state);

      start = performance.now();
    }
  });
};

export default useFrameInterval;
