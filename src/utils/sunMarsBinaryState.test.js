import { Object3D, Vector3 } from "three";
import {
  getPlotSunMarsBinaryDiagnostics,
  getPlotSunMarsBinaryState,
  getPlotSunMarsPrimaryCompanionState,
} from "./plotModelFunctions";
import {
  createSunMarsBinaryDiagnostics,
  createSunMarsBinaryState,
  createSunMarsPrimaryCompanionState,
  deriveSunMarsBinaryState,
  updateSunMarsBinaryDiagnostics,
  updateSunMarsBinaryState,
  updateSunMarsPrimaryCompanionState,
} from "./sunMarsBinaryState";

test("reconstructs both companion positions from one common centre", () => {
  const center = new Vector3(10, -4, 3);
  const sun = new Vector3(110, -4, 3);
  const mars = new Vector3(-140, -4, 3);
  const state = deriveSunMarsBinaryState(center, sun, mars);

  expect(state.centerKind).toBe("legacy-earth-pivot");
  expect(state.centerWorld.clone().add(state.sunFromCenter)).toEqual(sun);
  expect(state.centerWorld.clone().add(state.marsFromCenter)).toEqual(mars);
  expect(state.sunRadius).toBeCloseTo(100, 12);
  expect(state.marsRadius).toBeCloseTo(150, 12);
  expect(state.separation).toBeCloseTo(250, 12);
  expect(state.radiusRatio).toBeCloseTo(1.5, 12);
  expect(state.oppositionAngleDeg).toBeCloseTo(180, 12);
  expect(state.oppositionErrorDeg).toBeCloseTo(0, 12);
});

test("updates an existing state without replacing its vector objects", () => {
  const state = createSunMarsBinaryState();
  const originalSunVector = state.sunFromCenter;
  const originalMarsVector = state.marsFromCenter;

  updateSunMarsBinaryState(
    state,
    new Vector3(1, 2, 3),
    new Vector3(4, 6, 3),
    new Vector3(-2, -2, 3)
  );

  expect(state.sunFromCenter).toBe(originalSunVector);
  expect(state.marsFromCenter).toBe(originalMarsVector);
  expect(state.sunFromCenter).toEqual(new Vector3(3, 4, 0));
  expect(state.marsFromCenter).toEqual(new Vector3(-3, -4, 0));
  expect(state.valid).toBe(true);
});

test("does not invent an opposition angle for a zero-radius companion", () => {
  const center = new Vector3(2, 3, 4);
  const state = deriveSunMarsBinaryState(
    center,
    center,
    new Vector3(3, 3, 4)
  );

  expect(state.radiusRatio).toBeNull();
  expect(state.oppositionAngleDeg).toBeNull();
  expect(state.oppositionErrorDeg).toBeNull();
});

test("derives the same state from the hidden plot-model pivots", () => {
  const pivot = (x, y, z) => {
    const object = new Object3D();
    object.position.set(x, y, z);
    return { current: object };
  };
  const plotObjects = [
    { name: "Earth", pivotRef: pivot(10, -4, 3) },
    { name: "Sun", pivotRef: pivot(110, -4, 3) },
    { name: "Mars", pivotRef: pivot(-140, -4, 3) },
  ];

  const state = getPlotSunMarsBinaryState(plotObjects);

  expect(state.valid).toBe(true);
  expect(state.sunFromCenter).toEqual(new Vector3(100, 0, 0));
  expect(state.marsFromCenter).toEqual(new Vector3(-150, 0, 0));
  expect(state.oppositionAngleDeg).toBeCloseTo(180, 12);
});

test("compares legacy, PVP and midpoint reference centres", () => {
  const diagnostics = createSunMarsBinaryDiagnostics();
  updateSunMarsBinaryDiagnostics(
    diagnostics,
    new Vector3(10, 0, 0),
    new Vector3(0, 0, 0),
    new Vector3(110, 0, 0),
    new Vector3(-140, 0, 0)
  );

  expect(diagnostics.legacyEarthPivot.sunRadius).toBeCloseTo(100, 12);
  expect(diagnostics.pvpSystemCenter.sunRadius).toBeCloseTo(110, 12);
  expect(diagnostics.geometricMidpoint.radiusRatio).toBeCloseTo(1, 12);
  expect(diagnostics.geometricMidpoint.oppositionErrorDeg).toBeCloseTo(0, 12);
  expect(diagnostics.geometricMidpoint.centerWorld).toEqual(
    new Vector3(-15, 0, 0)
  );
});

test("samples all three centres from the hidden plot model", () => {
  const pivot = (x, y, z) => {
    const object = new Object3D();
    object.position.set(x, y, z);
    return { current: object };
  };
  const plotObjects = [
    { name: "SystemCenter", pivotRef: pivot(0, 0, 0) },
    { name: "Earth", pivotRef: pivot(10, 0, 0) },
    { name: "Sun", pivotRef: pivot(110, 0, 0) },
    { name: "Mars", pivotRef: pivot(-140, 0, 0) },
  ];

  const diagnostics = getPlotSunMarsBinaryDiagnostics(plotObjects);

  expect(diagnostics.valid).toBe(true);
  expect(diagnostics.legacyEarthPivot.sunRadius).toBeCloseTo(100, 12);
  expect(diagnostics.pvpSystemCenter.marsRadius).toBeCloseTo(140, 12);
  expect(diagnostics.geometricMidpoint.centerWorld.x).toBeCloseTo(-15, 12);
});

test("reconstructs Mars exactly from the Sun primary and relative vector", () => {
  const state = createSunMarsPrimaryCompanionState();
  const sun = new Vector3(100, -2, 5);
  const mars = new Vector3(-30, 8, 12);

  updateSunMarsPrimaryCompanionState(state, sun, mars);

  expect(state.relationshipKind).toBe("asymmetric-primary-companion");
  expect(state.primaryName).toBe("Sun");
  expect(state.companionName).toBe("Mars");
  expect(state.primaryWorld.clone().add(state.companionFromPrimary)).toEqual(
    mars
  );
  expect(state.distance).toBeCloseTo(mars.distanceTo(sun), 12);
});

test("derives the asymmetric relationship from hidden plot pivots", () => {
  const pivot = (x, y, z) => {
    const object = new Object3D();
    object.position.set(x, y, z);
    return { current: object };
  };
  const plotObjects = [
    { name: "Sun", pivotRef: pivot(100, 0, 0) },
    { name: "Mars", pivotRef: pivot(-50, 10, 0) },
  ];

  const state = getPlotSunMarsPrimaryCompanionState(plotObjects);

  expect(state.valid).toBe(true);
  expect(state.companionFromPrimary).toEqual(new Vector3(-150, 10, 0));
  expect(state.primaryWorld.clone().add(state.companionFromPrimary)).toEqual(
    state.companionWorld
  );
});
