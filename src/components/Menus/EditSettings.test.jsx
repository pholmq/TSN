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
