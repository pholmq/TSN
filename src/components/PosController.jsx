import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useStore, useSettingsStore, usePosStore } from "../store";
import { getRaDecDistance } from "../utils/celestial-functions";
import useFrameInterval from "../utils/useFrameInterval";

const PosController = () => {
  const { scene } = useThree();
  const { settings } = useSettingsStore();
  const showPositions = useStore((s) => s.showPositions);

  const tracked = settings
    .filter((item) => item.traceable)
    .map((item) => item.name);

  usePosStore.setState(() => ({ trackedObjects: tracked }));

  function updatePositions() {
    // console.log("iran")
    let positions = {}; // Fresh object for positions

    for (const item of tracked) {
      positions[item] = getRaDecDistance(item, scene);
    }
    // Update the store with new positions
    usePosStore.setState({ positions });
  }

  let previousPosRef = null;

  useFrameInterval(() => {
    console.log("iran")
    if (!showPositions) return;
    const currentPosRef = useStore.getState().posRef.current;
    // Only update if posRef.current has changed
    // if (currentPosRef === previousPosRef) return;
    
    updatePositions();

    // Update the previous value for the next check
    previousPosRef = currentPosRef;
  }, 200);

  useEffect(() => {
    updatePositions();
  }, []);

  return null;
};

export default PosController;
