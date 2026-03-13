import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useStore, useSettingsStore, usePosStore } from "../store";
import { getRaDecDistance } from "../utils/celestial-functions";
import useFrameInterval from "../utils/useFrameInterval";

const PosController = () => {
  const { scene } = useThree();
  const trackedNames = useRef([]);

  // OPTIMIZATION: Only parse the traceable settings once on mount (or when settings drastically change)
  useEffect(() => {
    const tracked = useSettingsStore
      .getState()
      .settings.filter((item) => item.traceable)
      .map((item) => item.name);

    trackedNames.current = tracked;

    // Move side-effects out of the render body and into a layout effect
    usePosStore.setState({ trackedObjects: tracked });
  }, []);

  useFrameInterval(() => {
    // OPTIMIZATION: Read imperatively to avoid component re-renders when toggling the UI
    if (!useStore.getState().showPositions) return;

    let positions = {};

    // Use the cached names array instead of filtering the settings store every 200ms
    for (const item of trackedNames.current) {
      positions[item] = getRaDecDistance(item, scene);
    }

    usePosStore.setState({ positions });
  }, 200);

  return null;
};

export default PosController;
