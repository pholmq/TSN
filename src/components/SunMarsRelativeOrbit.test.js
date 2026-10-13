import { Matrix4, Object3D, Vector3 } from "three";
import settings from "../settings/celestial-model.json";
import {
  buildSettingsIndex,
  normalizeCelestialSettings,
} from "../utils/celestialSettingsSchema";
import {
  createSunMarsRelativeComponents,
  updateSunMarsRelativeComponents,
  updateSunRelativeFrame,
} from "./SunMarsRelativeOrbit";

const byName = buildSettingsIndex(normalizeCelestialSettings(settings));

const alteredSunIndex = () => {
  const altered = normalizeCelestialSettings(settings).map((setting) =>
    ["sun", "sun-deferent"].includes(setting.id)
      ? {
          ...setting,
          orbitRadius: 9876,
          orbitCentera: -4321,
          orbitCenterb: 1234,
          orbitCenterc: 6789,
          orbitTilta: 71,
          orbitTiltb: -39,
          startPos: 222,
        }
      : setting
  );
  return buildSettingsIndex(altered);
};

test.each([-100, -0.001, 0, 0.25, 3.75, 26, 100])(
  "evaluates Mars entirely from native parent-relative settings at %p",
  (position) => {
    const actual = updateSunMarsRelativeComponents(
      createSunMarsRelativeComponents(),
      byName,
      position
    );
    const changedParent = updateSunMarsRelativeComponents(
      createSunMarsRelativeComponents(),
      alteredSunIndex(),
      position
    );
    const carrier = byName.get("mars-deferent-e");

    expect(carrier.orbitRadius).toBe(0);
    expect(actual.centreDifference.toArray()).toEqual([
      carrier.orbitCentera,
      carrier.orbitCenterc,
      carrier.orbitCenterb,
    ]);
    expect(
      actual.centreDifference.distanceTo(changedParent.centreDifference)
    ).toBeLessThan(1e-12);
    expect(
      actual.annualCarrierMismatch.distanceTo(
        changedParent.annualCarrierMismatch
      )
    ).toBeLessThan(1e-12);
    expect(
      actual.deferentSHarmonic.distanceTo(changedParent.deferentSHarmonic)
    ).toBeLessThan(1e-12);
    expect(actual.mainBasis.elements).toEqual(changedParent.mainBasis.elements);
  }
);

test("places the relative frame at the Sun while retaining binary-frame axes", () => {
  const worldRoot = new Object3D();
  worldRoot.position.set(7, -4, 2);
  worldRoot.rotation.set(0.1, -0.2, 0.05);

  const binaryFrame = new Object3D();
  binaryFrame.name = "Sun-Mars Binary Frame";
  binaryFrame.position.set(3, 1, -2);
  binaryFrame.rotation.set(-0.04, 0.3, 0.02);
  worldRoot.add(binaryFrame);

  const sunParent = new Object3D();
  sunParent.position.set(100, -0.5, 3.3);
  sunParent.rotation.set(0.01, 1.2, -0.02);
  binaryFrame.add(sunParent);

  const relativeFrame = new Object3D();
  relativeFrame.matrixAutoUpdate = false;
  sunParent.add(relativeFrame);
  const marker = new Object3D();
  marker.position.set(2, 0, 0);
  relativeFrame.add(marker);

  expect(updateSunRelativeFrame(relativeFrame)).toBe(true);
  worldRoot.updateMatrixWorld(true);

  const actualOrigin = relativeFrame.getWorldPosition(new Vector3());
  const expectedOrigin = sunParent.getWorldPosition(new Vector3());
  expect(actualOrigin.distanceTo(expectedOrigin)).toBeLessThan(1e-10);

  const actualMarker = marker.getWorldPosition(new Vector3());
  const expectedMarker = new Vector3(2, 0, 0)
    .applyMatrix4(new Matrix4().extractRotation(binaryFrame.matrixWorld))
    .add(expectedOrigin);
  expect(actualMarker.distanceTo(expectedMarker)).toBeLessThan(1e-10);
});
