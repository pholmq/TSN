import settings from "../settings/celestial-model.json";
import {
  buildSettingsIndex,
  normalizeCelestialSettings,
} from "../utils/celestialSettingsSchema";
import {
  createErosSunRelativeComponents,
  updateErosSunRelativeComponents,
} from "./ErosSunRelativeOrbit";

const byName = buildSettingsIndex(normalizeCelestialSettings(settings));

test.each([-100, -0.001, 0, 0.25, 3.75, 26, 100])(
  "evaluates Eros without an absolute parent-sized carrier at %p",
  (position) => {
    const components = updateErosSunRelativeComponents(
      createErosSunRelativeComponents(),
      byName,
      position
    );
    const carrier = byName.get("eros-deferent-a");

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

test("retains Eros's non-zero direct annual residual", () => {
  const components = updateErosSunRelativeComponents(
    createErosSunRelativeComponents(),
    byName,
    4.25
  );
  const carrier = byName.get("eros-deferent-a");

  expect(carrier.orbitRadius).toBe(0);
  expect(components.annualCarrierMismatch.length()).toBeGreaterThan(1);
});
