import settings from "../settings/celestial-model.json";
import {
  buildSettingsIndex,
  normalizeCelestialSettings,
} from "../utils/celestialSettingsSchema";
import {
  createMercurySunRelativeComponents,
  updateMercurySunRelativeComponents,
} from "./MercurySunRelativeOrbit";

const byName = buildSettingsIndex(normalizeCelestialSettings(settings));
const number = (setting, key) => Number(setting[key] || 0);

test.each([-100, -0.001, 0, 0.25, 3.75, 26, 100])(
  "evaluates Mercury without an absolute parent-sized carrier at %p",
  (position) => {
    const components = updateMercurySunRelativeComponents(
      createMercurySunRelativeComponents(),
      byName,
      position
    );
    const carrier = byName.get("mercury-deferent-a");

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

test("retains the active centre of zero-radius Mercury deferent B", () => {
  const components = updateMercurySunRelativeComponents(
    createMercurySunRelativeComponents(),
    byName,
    4.25
  );
  const mercuryB = byName.get("mercury-deferent-b");
  const centreLength = Math.hypot(
    number(mercuryB, "orbitCentera"),
    number(mercuryB, "orbitCenterb"),
    number(mercuryB, "orbitCenterc")
  );

  expect(number(mercuryB, "orbitRadius")).toBe(0);
  expect(centreLength).toBeGreaterThan(0);
  expect(components.deferentBStage.length()).toBeCloseTo(centreLength, 10);
});
