import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useStore, useSettingsStore, usePosStore } from "../store";
import { getRaDecDistance } from "../utils/celestial-functions";
import useFrameInterval from "../utils/useFrameInterval";

const PosController = () => {
  const { scene } = useThree();
  const trackedNames = useRef([]);

  useEffect(() => {
    // Cache the traceable settings once on mount to avoid filtering on every frame interval
    const tracked = useSettingsStore
      .getState()
      .settings.filter((item) => item.traceable)
      .map((item) => item.name);

    trackedNames.current = tracked;

    // Push the initial layout out of the render phase
    usePosStore.setState({ trackedObjects: tracked });
  }, []);

  useFrameInterval(() => {
    // Read imperatively; avoids hooking component to high-frequency state changes
    if (!useStore.getState().showPositions) return;

    let positions = {};

    // Iterate over the cached array
    for (let i = 0; i < trackedNames.current.length; i++) {
      const item = trackedNames.current[i];
      positions[item] = getRaDecDistance(item, scene);
    }

    usePosStore.setState({ positions });
  }, 200);

  return null;
};

export default PosController;
