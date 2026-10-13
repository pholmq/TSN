import celestialModel from "../settings/celestial-model.json";
import {
  buildSettingsIndex,
  getCelestialEditorGroups,
  getCelestialSettingsCatalog,
  mergeCelestialSettings,
  normalizeCelestialSettings,
  serializeCelestialSettings,
} from "./celestialSettingsSchema";

const numericSnapshot = (settings) =>
  settings.map(({ id, name, ...values }) => ({ id, name, values }));

test("loads the complete unified native model", () => {
  const settings = normalizeCelestialSettings(celestialModel);
  expect(settings).toHaveLength(getCelestialSettingsCatalog().length);
  expect(new Set(settings.map((setting) => setting.id)).size).toBe(
    settings.length
  );
  expect(buildSettingsIndex(settings).get("mercury-plane").name).toBe(
    "Mercury Plane"
  );
});

test("imports a legacy flat settings array without changing its values", () => {
  const native = normalizeCelestialSettings(celestialModel);
  const legacy = native.map(({ id, ...setting }) => setting);
  const imported = normalizeCelestialSettings(legacy);
  expect(numericSnapshot(imported)).toEqual(numericSnapshot(native));
});

test("round-trips a complete unified model and preserves rotationStart", () => {
  const native = normalizeCelestialSettings(celestialModel);
  const document = serializeCelestialSettings(native);
  expect(document.schemaVersion).toBe(3);
  expect(
    document.bodies.find((body) => body.id === "earth").motion.orbit
      .rotationStart
  ).toBe(0);
  expect(numericSnapshot(normalizeCelestialSettings(document))).toEqual(
    numericSnapshot(native)
  );
});

test("applies partial legacy imports through stable IDs", () => {
  const native = normalizeCelestialSettings(celestialModel);
  const merged = mergeCelestialSettings(native, [
    { name: "Mercury", startPos: 123.5 },
  ]);
  expect(buildSettingsIndex(merged).get("mercury").startPos).toBe(123.5);
  expect(buildSettingsIndex(merged).get("venus").startPos).toBe(
    buildSettingsIndex(native).get("venus").startPos
  );
});

test("removes the common residual while retaining the Eros harmonic", () => {
  const native = normalizeCelestialSettings(celestialModel);
  const serialized = serializeCelestialSettings(native);
  const roundTrip = buildSettingsIndex(normalizeCelestialSettings(serialized));

  [
    "mars-deferent-e",
    "mercury-deferent-a",
    "venus-deferent-a",
  ].forEach((id) => {
    const carrier = roundTrip.get(id);
    expect(carrier.orbitRadius).toBe(0);
    expect(carrier.relativeAnnualSpeed).toBeUndefined();
  });
  expect(roundTrip.get("eros-deferent-a")).toEqual(
    expect.objectContaining({
      relativeAnnualSpeed: expect.any(Number),
      relativeAnnualCosY: expect.any(Number),
      relativeAnnualSinY: expect.any(Number),
    })
  );
});

test("rejects a former absolute carrier import in the unified model", () => {
  const native = normalizeCelestialSettings(celestialModel);
  expect(() =>
    mergeCelestialSettings(native, [
      {
        name: "Mercury deferent A",
        orbitRadius: 100,
        orbitCentera: -1.3,
      },
    ])
  ).toThrow(/former absolute carrier format/);
});

test("declares every motion component exactly once in the body-aware editor", () => {
  const settings = normalizeCelestialSettings(celestialModel);
  const grouped = getCelestialEditorGroups(settings).flatMap(
    (group) => group.settings
  );
  expect(grouped.map((setting) => setting.id).sort()).toEqual(
    settings.map((setting) => setting.id).sort()
  );
});
