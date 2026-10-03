import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import EditSettings from "./EditSettings";
import { useStore, useSettingsStore } from "../../store";

let mockLevaStore;

jest.mock("leva", () => {
  const leva = jest.requireActual("leva");
  return {
    ...leva,
    useCreateStore: () => {
      mockLevaStore = leva.useCreateStore();
      return mockLevaStore;
    },
    // Exercise the real control schema, setters and effects without the UI layout.
    Leva: () => null,
  };
});

const initialSettings = JSON.parse(
  JSON.stringify(useSettingsStore.getState().settings)
);
const initialMoonNode = initialSettings.find((s) => s.name === "Moon Node");
const initialMoonPlane = initialSettings.find((s) => s.name === "Moon Plane");
const initialMercury = initialSettings.find((s) => s.name === "Mercury");
const initialMercuryPlane = initialSettings.find(
  (s) => s.name === "Mercury Plane"
);
const initialVenus = initialSettings.find((s) => s.name === "Venus");
const initialVenusPlane = initialSettings.find((s) => s.name === "Venus Plane");
let root;
let container;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  useSettingsStore.setState({
    settings: JSON.parse(JSON.stringify(initialSettings)),
  });
  useStore.setState({ editSettings: true });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  delete global.IS_REACT_ACT_ENVIRONMENT;
});

test("opens with lunar geometry controls and only meaningful visibility toggles", () => {
  act(() => root.render(<EditSettings />));

  const data = mockLevaStore.getData();
  expect(data["Settings.Moon Node.Main Orbit.Moon Nodespeed"]).toBeDefined();
  expect(
    data["Settings.Moon Plane.Main Orbit.Moon PlaneorbitTilta"]
  ).toBeDefined();
  expect(data["Show / Hide settings.Moonvisible"].value).toBe(true);
  expect(data["Show / Hide settings.Moon Nodevisible"]).toBeUndefined();
  expect(data["Show / Hide settings.Moon Planevisible"]).toBeUndefined();
  expect(
    Object.keys(data).some((path) => path.includes("Moon deferent B"))
  ).toBe(false);
});

test("edits, resets and reopens lunar controls without losing synchronization", () => {
  act(() => root.render(<EditSettings />));
  const nodePath = "Settings.Moon Node.Main Orbit.Moon Nodespeed";
  const planePath = "Settings.Moon Plane.Main Orbit.Moon PlaneorbitTilta";

  act(() =>
    mockLevaStore.set(
      {
        [nodePath]: "\u200B-0.4",
        [planePath]: "\u200B6",
      },
      true
    )
  );
  expect(
    Number(useSettingsStore.getState().getSetting("Moon Node").speed)
  ).toBe(-0.4);
  expect(
    Number(useSettingsStore.getState().getSetting("Moon Plane").orbitTilta)
  ).toBe(6);

  act(() => useSettingsStore.getState().resetSettings());
  expect(Number(mockLevaStore.get(nodePath).replace(/\u200B/g, ""))).toBe(
    Number(initialMoonNode.speed)
  );
  expect(Number(mockLevaStore.get(planePath).replace(/\u200B/g, ""))).toBe(
    Number(initialMoonPlane.orbitTilta)
  );

  act(() => useStore.setState({ editSettings: false }));
  act(() => useStore.setState({ editSettings: true }));
  expect(Number(mockLevaStore.get(planePath).replace(/\u200B/g, ""))).toBe(
    Number(initialMoonPlane.orbitTilta)
  );
});

test("exposes fixed solar-satellite planes without visibility toggles", () => {
  act(() => root.render(<EditSettings />));

  const data = mockLevaStore.getData();
  expect(
    data["Settings.Mercury Plane.Main Orbit.Mercury PlaneorbitTilta"]
  ).toBeDefined();
  expect(
    data["Settings.Venus Plane.Main Orbit.Venus PlaneorbitTilta"]
  ).toBeDefined();
  expect(data["Show / Hide settings.Mercury Planevisible"]).toBeUndefined();
  expect(data["Show / Hide settings.Venus Planevisible"]).toBeUndefined();
  expect(
    Object.keys(data).some((path) => path.includes("Mercury Eccentric"))
  ).toBe(false);
  expect(
    Object.keys(data).some((path) => path.includes("Mercury Synodic"))
  ).toBe(false);

  // Preserve the calibrated split between each fixed plane and its planet.
  expect(Number(initialMercuryPlane.orbitCentera)).toBe(10.8);
  expect(Number(initialMercuryPlane.orbitCenterb)).toBe(4);
  expect(Number(initialMercuryPlane.orbitCenterc)).toBe(0);
  expect(Number(initialMercuryPlane.orbitTilta)).toBe(-4);
  expect(Number(initialMercuryPlane.orbitTiltb)).toBe(-3);
  expect(Number(initialMercury.orbitCentera)).toBe(-2);
  expect(Number(initialMercury.orbitCenterb)).toBe(-4.9);
  expect(Number(initialMercury.orbitCenterc)).toBe(0);
  expect(Number(initialMercury.orbitTilta)).toBe(0);
  expect(Number(initialMercury.orbitTiltb)).toBe(0.5);

  expect(Number(initialVenusPlane.orbitCentera)).toBe(1.8);
  expect(Number(initialVenusPlane.orbitCenterb)).toBe(-0.4);
  expect(Number(initialVenusPlane.orbitTilta)).toBe(3.4);
  expect(Number(initialVenusPlane.orbitTiltb)).toBe(0.3);
  expect(Number(initialVenus.orbitCenterb)).toBe(0);
  expect(Number(initialVenus.orbitTilta)).toBe(0);
  expect(Number(initialVenus.orbitTiltb)).toBe(0);
});
