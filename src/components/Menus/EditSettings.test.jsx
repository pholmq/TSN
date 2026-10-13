import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import EditSettings from "./EditSettings";
import { useStore, useSettingsStore } from "../../store";
import {
  applyCelestialSettingsDocument,
  getCurrentCelestialSettingsDocument,
} from "../../utils/saveAndLoadSettings";

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
  expect(
    data["Settings.Earth-Moon System.Moon.Node.Moon Nodespeed"]
  ).toBeDefined();
  expect(
    data["Settings.Earth-Moon System.Moon.Plane.Moon PlaneorbitTilta"]
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
  const nodePath = "Settings.Earth-Moon System.Moon.Node.Moon Nodespeed";
  const planePath =
    "Settings.Earth-Moon System.Moon.Plane.Moon PlaneorbitTilta";

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

test("serializes the latest edited value rather than the menu's initial snapshot", () => {
  act(() => root.render(<EditSettings />));
  const speedPath = "Settings.Earth-Moon System.Moon.Orbit.Moonspeed";

  act(() =>
    mockLevaStore.set({ [speedPath]: "\u200B83.2851946888" }, true)
  );

  const document = getCurrentCelestialSettingsDocument();
  const moon = document.bodies.find((body) => body.id === "moon");
  expect(Number(moon.motion.orbit.speed)).toBe(83.2851946888);
});

test("loads a saved unified model back into the store and visible controls", () => {
  act(() => root.render(<EditSettings />));
  const speedPath = "Settings.Earth-Moon System.Moon.Orbit.Moonspeed";

  act(() =>
    mockLevaStore.set({ [speedPath]: "\u200B83.2851946888" }, true)
  );
  const savedDocument = getCurrentCelestialSettingsDocument();
  const parsedDownloadedFile = JSON.parse(JSON.stringify(savedDocument));

  act(() => useSettingsStore.getState().resetSettings());
  expect(Number(useSettingsStore.getState().getSetting("Moon").speed)).toBe(
    Number(initialSettings.find((setting) => setting.name === "Moon").speed)
  );

  act(() => applyCelestialSettingsDocument(parsedDownloadedFile));
  expect(Number(useSettingsStore.getState().getSetting("Moon").speed)).toBe(
    83.2851946888
  );
  expect(Number(mockLevaStore.get(speedPath).replace(/\u200B/g, ""))).toBe(
    83.2851946888
  );
});

test("editing Pluto does not restore a stale hidden state", () => {
  act(() => root.render(<EditSettings />));

  const visibilityPath = "Show / Hide settings.Plutovisible";
  const speedPath = Object.keys(mockLevaStore.getData()).find((path) =>
    path.endsWith(".Plutospeed")
  );
  expect(speedPath).toBeDefined();

  // Pluto starts hidden. Reproduce the author's sequence: show it, then edit it.
  act(() => mockLevaStore.set({ [visibilityPath]: true }, true));
  expect(useSettingsStore.getState().getSetting("Pluto").visible).toBe(true);

  act(() => mockLevaStore.set({ [speedPath]: "\u200B0.123456" }, true));

  const pluto = useSettingsStore.getState().getSetting("Pluto");
  expect(pluto.visible).toBe(true);
  expect(Number(pluto.speed)).toBe(0.123456);
  expect(mockLevaStore.get(visibilityPath)).toBe(true);
});

test("exposes fixed solar-satellite planes without visibility toggles", () => {
  act(() => root.render(<EditSettings />));

  const data = mockLevaStore.getData();
  expect(
    data[
      "Settings.Mercury Junior Solar Moon.Mercury.Plane.Mercury PlaneorbitTilta"
    ]
  ).toBeDefined();
  expect(
    data[
      "Settings.Venus Senior Solar Moon.Venus.Plane.Venus PlaneorbitTilta"
    ]
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
  expect(Number(initialMercuryPlane.orbitTilta)).toBe(-4.5);
  expect(Number(initialMercuryPlane.orbitTiltb)).toBe(-2.5);
  expect(Number(initialMercury.orbitCentera)).toBe(-2);
  expect(Number(initialMercury.orbitCenterb)).toBe(-4.9);
  expect(Number(initialMercury.orbitCenterc)).toBe(0);
  expect(Number(initialMercury.orbitTilta)).toBe(0);
  expect(Number(initialMercury.orbitTiltb)).toBe(0.5);

  expect(Number(initialVenusPlane.orbitCentera)).toBe(1.8);
  expect(Number(initialVenusPlane.orbitCenterb)).toBe(-0.4);
  expect(Number(initialVenusPlane.orbitTilta)).toBe(3.4);
  expect(Number(initialVenusPlane.orbitTiltb)).toBe(0.2);
  expect(Number(initialVenus.orbitCenterb)).toBe(0);
  expect(Number(initialVenus.orbitTilta)).toBe(0);
  expect(Number(initialVenus.orbitTiltb)).toBe(0);
});
