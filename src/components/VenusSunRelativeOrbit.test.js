import settings from "../settings/celestial-model.json";
import {
  buildSettingsIndex,
  normalizeCelestialSettings,
} from "../utils/celestialSettingsSchema";
import {
  createVenusSunRelativeComponents,
  updateVenusSunRelativeComponents,
} from "./VenusSunRelativeOrbit";

const byName = buildSettingsIndex(normalizeCelestialSettings(settings));
const number = (setting, key) => Number(setting[key] || 0);

test.each([-100, -0.001, 0, 0.25, 3.75, 26, 100])(
  "evaluates Venus without an absolute parent-sized carrier at %p",
  (position) => {
    const components = updateVenusSunRelativeComponents(
      createVenusSunRelativeComponents(),
      byName,
      position
    );
    const carrier = byName.get("venus-deferent-a");

    expect(carrier.orbitRadius).toBe(0);
    expect(components.centreDifference.toArray()).toEqual([
      carrier.orbitCentera,
      carrier.orbitCenterc,
      carrier.orbitCenterb,
    ]);
    expect(
      components.annualCarrierMismatch.toArray().every(Number.isFinite)
    ).toBe(true);
    expect(components.mainBasis.elements.every(Number.isFinite)).toBe(true);
  }
);

test("retains the complete non-zero Venus deferent-B translation", () => {
  const components = updateVenusSunRelativeComponents(
    createVenusSunRelativeComponents(),
    byName,
    4.25
  );
  const venusB = byName.get("venus-deferent-b");

  expect(number(venusB, "orbitRadius")).toBeGreaterThan(0);
  expect(components.deferentBStage.length()).toBeCloseTo(
    number(venusB, "orbitRadius"),
    10
  );
});
