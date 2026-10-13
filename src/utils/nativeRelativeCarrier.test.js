import settingsDocument from "../settings/celestial-model.json";
import {
  buildSettingsIndex,
  normalizeCelestialSettings,
} from "./celestialSettingsSchema";
import {
  createNativeRelativeCarrierState,
  hasNativeRelativeCarrier,
  updateNativeRelativeCarrier,
} from "./nativeRelativeCarrier";

const settings = buildSettingsIndex(
  normalizeCelestialSettings(settingsDocument)
);

test("evaluates the stored cosine and sine vectors at quarter phases", () => {
  const carrier = settings.get("eros-deferent-a");
  const state = createNativeRelativeCarrierState();
  const quarter = Math.PI / (2 * carrier.relativeAnnualSpeed);

  updateNativeRelativeCarrier(state, carrier, 0);
  expect(state.annualResidual.toArray()).toEqual([
    carrier.relativeAnnualCosX,
    carrier.relativeAnnualCosY,
    carrier.relativeAnnualCosZ,
  ]);

  updateNativeRelativeCarrier(state, carrier, quarter);
  expect(state.annualResidual.x).toBeCloseTo(carrier.relativeAnnualSinX, 12);
  expect(state.annualResidual.y).toBeCloseTo(carrier.relativeAnnualSinY, 12);
  expect(state.annualResidual.z).toBeCloseTo(carrier.relativeAnnualSinZ, 12);
});

test("treats an omitted annual harmonic as an exact zero vector", () => {
  const mars = settings.get("mars-deferent-e");
  const state = createNativeRelativeCarrierState();
  expect(hasNativeRelativeCarrier(mars)).toBe(true);
  expect(mars.relativeAnnualSpeed).toBeUndefined();
  updateNativeRelativeCarrier(state, mars, 123.5);
  expect(state.annualResidual.toArray()).toEqual([0, 0, 0]);
  expect(() =>
    updateNativeRelativeCarrier(createNativeRelativeCarrierState(), undefined, 0)
  ).toThrow(/not a native relative carrier/);
});
