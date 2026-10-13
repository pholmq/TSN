import { Vector3 } from "three";

const RAD_TO_DEG = 180 / Math.PI;
const MIN_VECTOR_LENGTH_SQ = 1e-20;

/**
 * Mutable state container for the Sun-Mars binary geometry.
 *
 * The reference centre is the moving Earth pivot already inherited by the two
 * legacy transform chains. It is not asserted to be a physical barycentre.
 * Keeping the state mutable avoids allocating a
 * collection of vectors on every animation or ephemeris step.
 */
export const createSunMarsBinaryState = (
  centerKind = "legacy-earth-pivot"
) => ({
  valid: false,
  centerKind,
  centerWorld: new Vector3(),
  sunWorld: new Vector3(),
  marsWorld: new Vector3(),
  sunFromCenter: new Vector3(),
  marsFromCenter: new Vector3(),
  sunToMars: new Vector3(),
  sunRadius: 0,
  marsRadius: 0,
  separation: 0,
  radiusRatio: null,
  oppositionAngleDeg: null,
  oppositionErrorDeg: null,
});

export const createSunMarsBinaryDiagnostics = () => ({
  valid: false,
  legacyEarthPivot: createSunMarsBinaryState("legacy-earth-pivot"),
  pvpSystemCenter: createSunMarsBinaryState("pvp-system-center"),
  geometricMidpoint: createSunMarsBinaryState("geometric-midpoint"),
  sample: {
    earthWorld: new Vector3(),
    pvpWorld: new Vector3(),
    sunWorld: new Vector3(),
    marsWorld: new Vector3(),
    midpointWorld: new Vector3(),
  },
});

/**
 * Exact asymmetric decomposition with the Sun as primary and Mars as companion.
 * This is a change of coordinates only: it does not impose a new Mars orbit.
 */
export const createSunMarsPrimaryCompanionState = () => ({
  valid: false,
  relationshipKind: "asymmetric-primary-companion",
  primaryName: "Sun",
  companionName: "Mars",
  primaryWorld: new Vector3(),
  companionWorld: new Vector3(),
  companionFromPrimary: new Vector3(),
  distance: 0,
});

export const updateSunMarsPrimaryCompanionState = (
  state,
  sunWorld,
  marsWorld
) => {
  state.primaryWorld.copy(sunWorld);
  state.companionWorld.copy(marsWorld);
  state.companionFromPrimary.subVectors(marsWorld, sunWorld);
  state.distance = state.companionFromPrimary.length();
  state.valid = true;
  return state;
};

/**
 * Re-express existing positions as a common centre plus two companion vectors.
 * This is an exact coordinate decomposition, not a fitted orbit or constraint.
 */
export const updateSunMarsBinaryState = (
  state,
  centerWorld,
  sunWorld,
  marsWorld
) => {
  state.centerWorld.copy(centerWorld);
  state.sunWorld.copy(sunWorld);
  state.marsWorld.copy(marsWorld);
  state.sunFromCenter.subVectors(sunWorld, centerWorld);
  state.marsFromCenter.subVectors(marsWorld, centerWorld);
  state.sunToMars.subVectors(marsWorld, sunWorld);

  state.sunRadius = state.sunFromCenter.length();
  state.marsRadius = state.marsFromCenter.length();
  state.separation = state.sunToMars.length();
  state.radiusRatio =
    state.sunRadius > 0 ? state.marsRadius / state.sunRadius : null;

  if (
    state.sunFromCenter.lengthSq() > MIN_VECTOR_LENGTH_SQ &&
    state.marsFromCenter.lengthSq() > MIN_VECTOR_LENGTH_SQ
  ) {
    state.oppositionAngleDeg =
      state.sunFromCenter.angleTo(state.marsFromCenter) * RAD_TO_DEG;
    state.oppositionErrorDeg = 180 - state.oppositionAngleDeg;
  } else {
    state.oppositionAngleDeg = null;
    state.oppositionErrorDeg = null;
  }

  state.valid = true;
  return state;
};

export const deriveSunMarsBinaryState = (
  centerWorld,
  sunWorld,
  marsWorld
) =>
  updateSunMarsBinaryState(
    createSunMarsBinaryState(),
    centerWorld,
    sunWorld,
    marsWorld
  );

export const updateSunMarsBinaryDiagnostics = (
  diagnostics,
  earthWorld,
  pvpWorld,
  sunWorld,
  marsWorld
) => {
  diagnostics.sample.earthWorld.copy(earthWorld);
  diagnostics.sample.pvpWorld.copy(pvpWorld);
  diagnostics.sample.sunWorld.copy(sunWorld);
  diagnostics.sample.marsWorld.copy(marsWorld);
  diagnostics.sample.midpointWorld
    .addVectors(sunWorld, marsWorld)
    .multiplyScalar(0.5);

  updateSunMarsBinaryState(
    diagnostics.legacyEarthPivot,
    diagnostics.sample.earthWorld,
    diagnostics.sample.sunWorld,
    diagnostics.sample.marsWorld
  );
  updateSunMarsBinaryState(
    diagnostics.pvpSystemCenter,
    diagnostics.sample.pvpWorld,
    diagnostics.sample.sunWorld,
    diagnostics.sample.marsWorld
  );
  updateSunMarsBinaryState(
    diagnostics.geometricMidpoint,
    diagnostics.sample.midpointWorld,
    diagnostics.sample.sunWorld,
    diagnostics.sample.marsWorld
  );
  diagnostics.valid = true;
  return diagnostics;
};
