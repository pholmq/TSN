import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { useStore } from "../store";
import {
  createSunMarsBinaryState,
  createSunMarsPrimaryCompanionState,
  updateSunMarsBinaryState,
  updateSunMarsPrimaryCompanionState,
} from "../utils/sunMarsBinaryState";

/**
 * Publishes both the legacy common-centre diagnostics and the exact asymmetric
 * Sun-primary / Mars-companion decomposition from the live visual model.
 * It observes existing objects only; it never modifies their transformations.
 */
const SunMarsBinaryTracker = () => {
  const { scene } = useThree();
  const binaryStateRef = useStore((state) => state.sunMarsBinaryStateRef);
  const primaryCompanionStateRef = useStore(
    (state) => state.sunMarsPrimaryCompanionStateRef
  );
  const binaryState = useMemo(createSunMarsBinaryState, []);
  const primaryCompanionState = useMemo(
    createSunMarsPrimaryCompanionState,
    []
  );
  const positions = useMemo(
    () => ({
      center: new Vector3(),
      sun: new Vector3(),
      mars: new Vector3(),
    }),
    []
  );

  useFrame(() => {
    const earth = scene.getObjectByName("Earth");
    const sun = scene.getObjectByName("Sun");
    const mars = scene.getObjectByName("Mars");

    if (!earth || !sun || !mars) {
      binaryState.valid = false;
      primaryCompanionState.valid = false;
      binaryStateRef.current = binaryState;
      primaryCompanionStateRef.current = primaryCompanionState;
      return;
    }

    earth.getWorldPosition(positions.center);
    sun.getWorldPosition(positions.sun);
    mars.getWorldPosition(positions.mars);
    updateSunMarsBinaryState(
      binaryState,
      positions.center,
      positions.sun,
      positions.mars
    );
    updateSunMarsPrimaryCompanionState(
      primaryCompanionState,
      positions.sun,
      positions.mars
    );
    binaryStateRef.current = binaryState;
    primaryCompanionStateRef.current = primaryCompanionState;
  });

  return null;
};

export default SunMarsBinaryTracker;
