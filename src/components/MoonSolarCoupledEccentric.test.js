import { Quaternion, Vector3 } from "three";
import {
  deriveSolarCoupledLunarAngles,
  eclipticOffsetInParentFrame,
  scaleRadialProjection,
  signedAngleInEclipticXZ,
  tangentialProjection,
  wrapRadians,
} from "./MoonSolarCoupledEccentric";

const vectorAt = (angle) =>
  new Vector3(Math.cos(angle), 0, -Math.sin(angle));

test("recovers signed ecliptic longitude using the Three.js Y-rotation convention", () => {
  expect(signedAngleInEclipticXZ(vectorAt(0.7))).toBeCloseTo(0.7, 12);
  expect(signedAngleInEclipticXZ(vectorAt(-1.1))).toBeCloseTo(-1.1, 12);
});

test("uses 2D-M as correction argument relative to lunar longitude", () => {
  const moonLongitude = 1.2;
  const sunLongitude = 0.25;
  const anomalisticPhase = 0.35;
  const result = deriveSolarCoupledLunarAngles(
    vectorAt(moonLongitude),
    vectorAt(sunLongitude),
    anomalisticPhase
  );
  const expectedElongation = wrapRadians(moonLongitude - sunLongitude);
  const expectedArgument = wrapRadians(
    2 * expectedElongation - anomalisticPhase
  );
  expect(result.elongation).toBeCloseTo(expectedElongation, 12);
  expect(result.inequalityArgument).toBeCloseTo(expectedArgument, 12);
  expect(result.eccentricOrientation).toBeCloseTo(
    wrapRadians(moonLongitude + expectedArgument),
    12
  );
  expect(result.variationOrientation).toBeCloseTo(
    wrapRadians(moonLongitude + 2 * expectedElongation),
    12
  );
});

test("wraps the elongation continuously across the plus/minus pi boundary", () => {
  const result = deriveSolarCoupledLunarAngles(
    vectorAt(-Math.PI + 0.1),
    vectorAt(Math.PI - 0.1),
    0
  );
  expect(result.elongation).toBeCloseTo(0.2, 12);
});

test("expresses a fixed-ecliptic offset in moving parent coordinates", () => {
  const parentRotation = new Quaternion().setFromAxisAngle(
    new Vector3(0, 1, 0),
    0.4
  );
  const local = eclipticOffsetInParentFrame(
    0.9,
    2,
    parentRotation.clone().invert()
  );
  const reconstructedWorld = local.applyQuaternion(parentRotation);
  expect(reconstructedWorld.x).toBeCloseTo(vectorAt(0.9).x * 2, 12);
  expect(reconstructedWorld.y).toBeCloseTo(0, 12);
  expect(reconstructedWorld.z).toBeCloseTo(vectorAt(0.9).z * 2, 12);
});

test("removes the radial component from an anomalistic displacement", () => {
  const radial = new Vector3(2, 1, -3).normalize();
  const displacement = new Vector3(0.7, -0.2, 0.4);
  const tangent = tangentialProjection(displacement, radial);
  expect(tangent.dot(radial)).toBeCloseTo(0, 12);
});

test("reflects only the radial part of a solar variation displacement", () => {
  const radial = new Vector3(1, 0, 0);
  const displacement = new Vector3(2, 0, 3);
  const reflected = scaleRadialProjection(displacement, radial, -1);
  expect(reflected.x).toBeCloseTo(-2, 12);
  expect(reflected.y).toBeCloseTo(0, 12);
  expect(reflected.z).toBeCloseTo(3, 12);
});
