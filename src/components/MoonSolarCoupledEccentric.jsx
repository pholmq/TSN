import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import { usePlotStore, useSettingsStore, useStore } from "../store";
import { findCelestialSetting } from "../utils/celestialSettingsSchema";

const D2R = Math.PI / 180;
const DISPLAY_MOON_SCALE = 39.2078;
export const MOON_SOLAR_ECCENTRIC_UPDATER =
  "Moon Solar-Coupled Eccentric Updater";

const finite = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const wrapRadians = (value) =>
  Math.atan2(Math.sin(value), Math.cos(value));

// THREE.RotationY(angle) maps +X toward -Z, hence atan2(-z, x).
export const signedAngleInEclipticXZ = (vector) =>
  Math.atan2(-vector.z, vector.x);

export const deriveSolarCoupledLunarAngles = (
  earthToMoonEcliptic,
  earthToSunEcliptic,
  anomalisticPhase
) => {
  const moonLongitude = signedAngleInEclipticXZ(earthToMoonEcliptic);
  const sunLongitude = signedAngleInEclipticXZ(earthToSunEcliptic);
  const elongation = wrapRadians(moonLongitude - sunLongitude);
  const inequalityArgument = wrapRadians(2 * elongation - anomalisticPhase);

  // 2D-M is the wanted longitude-correction argument, not the absolute
  // direction of the eccentric centre. A small centre displacement changes
  // observed lunar longitude according to its angle relative to the Moon.
  const eccentricOrientation = wrapRadians(
    moonLongitude + inequalityArgument
  );
  // A centre vector at lambdaMoon + 2D produces a geometrical half-synodic
  // angular term. Its frequency comes from elongation, not a stored period.
  const variationOrientation = wrapRadians(
    moonLongitude + 2 * elongation
  );
  return {
    moonLongitude,
    sunLongitude,
    elongation,
    anomalisticPhase,
    inequalityArgument,
    eccentricOrientation,
    variationOrientation,
  };
};

export const eclipticOffsetInParentFrame = (
  orientation,
  radius,
  inverseParentQuaternion,
  target = new Vector3()
) =>
  target
    .set(Math.cos(orientation) * radius, 0, -Math.sin(orientation) * radius)
    .applyQuaternion(inverseParentQuaternion);

export const tangentialProjection = (
  displacement,
  radialDirection,
  target = new Vector3()
) => {
  const radialLengthSq = radialDirection.lengthSq();
  if (radialLengthSq === 0) return target.copy(displacement);
  const radialScale = displacement.dot(radialDirection) / radialLengthSq;
  return target
    .copy(displacement)
    .addScaledVector(radialDirection, -radialScale);
};

export const scaleRadialProjection = (
  displacement,
  radialDirection,
  radialMultiplier,
  target = new Vector3()
) => {
  const radialLengthSq = radialDirection.lengthSq();
  if (radialLengthSq === 0) return target.copy(displacement);
  const radialScale = displacement.dot(radialDirection) / radialLengthSq;
  return target
    .copy(displacement)
    .addScaledVector(
      radialDirection,
      radialScale * (radialMultiplier - 1)
    );
};

const MoonSolarCoupledEccentric = ({
  children,
  targetName = "Moon",
  plotMode = false,
}) => {
  const { scene } = useThree();
  const setting = useSettingsStore(
    useCallback(
      (state) =>
        findCelestialSetting(state.settings, "moon-solar-eccentric"),
      []
    )
  );
  const variationSetting = useSettingsStore(
    useCallback(
      (state) =>
        findCelestialSetting(state.settings, "moon-solar-variation"),
      []
    )
  );
  const anomalisticTangentSetting = useSettingsStore(
    useCallback(
      (state) =>
        findCelestialSetting(state.settings, "moon-anomalistic-tangent"),
      []
    )
  );
  const moon = useSettingsStore(
    useCallback(
      (state) => findCelestialSetting(state.settings, "moon"),
      []
    )
  );
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const posRef = useStore((state) => state.posRef);
  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);

  const offsetRef = useRef();
  const earthWorld = useMemo(() => new Vector3(), []);
  const sunWorld = useMemo(() => new Vector3(), []);
  const moonWorld = useMemo(() => new Vector3(), []);
  const earthToMoonEcliptic = useMemo(() => new Vector3(), []);
  const earthToSunEcliptic = useMemo(() => new Vector3(), []);
  const parentQuaternionInverse = useMemo(() => new Quaternion(), []);
  const localOffset = useMemo(() => new Vector3(), []);
  const eccentricWorld = useMemo(() => new Vector3(), []);
  const variationOffset = useMemo(() => new Vector3(), []);
  const deferentPivotWorld = useMemo(() => new Vector3(), []);
  const deferentContainerWorld = useMemo(() => new Vector3(), []);
  const anomalisticWorld = useMemo(() => new Vector3(), []);
  const anomalisticLocal = useMemo(() => new Vector3(), []);

  const physicalCoordinates = targetName.startsWith("Actual ");
  const distanceScale =
    actualPlanetSizes || physicalCoordinates ? 1 : DISPLAY_MOON_SCALE;
  const amplitude = finite(setting?.orbitRadius) * distanceScale;
  const variationAmplitude =
    finite(variationSetting?.orbitRadius) * distanceScale;
  const anomalisticTangentAmplitude =
    finite(anomalisticTangentSetting?.orbitRadius) * distanceScale;
  const updaterName = `${MOON_SOLAR_ECCENTRIC_UPDATER}:${targetName}`;

  const update = useCallback(
    (position) => {
      const offset = offsetRef.current;
      const parent = offset?.parent;
      if (!offset || !parent || !moon) return false;

      const plotObjects = usePlotStore.getState().plotObjects;
      const earthObject = plotMode
        ? plotObjects.find((item) => item.name === "Earth")?.pivotRef?.current
        : scene.getObjectByName("Earth");
      const sunObject = plotMode
        ? plotObjects.find((item) => item.name === "Sun")?.pivotRef?.current
        : scene.getObjectByName("Sun");
      const moonObject = plotMode
        ? plotObjects.find((item) => item.name === targetName)?.pivotRef?.current
        : scene.getObjectByName(targetName);
      if (!earthObject || !sunObject || !moonObject) return false;

      const modelPosition = Number.isFinite(position) ? position : 0;
      const anomalisticPhase =
        finite(moon.speed) * modelPosition - finite(moon.startPos) * D2R;

      // Sample the accepted geometry without feeding the experimental offset
      // back into its own angle calculation.
      offset.position.set(0, 0, 0);
      parent.updateWorldMatrix(true, true);
      earthObject.getWorldPosition(earthWorld);
      sunObject.getWorldPosition(sunWorld);
      moonObject.getWorldPosition(moonWorld);

      // World XZ is the model's fixed ecliptic reference. Both directions are
      // measured here before the centre vector is converted into the moving
      // Moon-stage parent's local coordinates.
      earthToMoonEcliptic.subVectors(moonWorld, earthWorld);
      earthToSunEcliptic.subVectors(sunWorld, earthWorld);
      if (
        earthToMoonEcliptic.lengthSq() === 0 ||
        earthToSunEcliptic.lengthSq() === 0
      ) {
        return false;
      }

      const angles = deriveSolarCoupledLunarAngles(
        earthToMoonEcliptic,
        earthToSunEcliptic,
        anomalisticPhase
      );
      parent.getWorldQuaternion(parentQuaternionInverse).invert();
      eccentricWorld.set(
        Math.cos(angles.eccentricOrientation) * amplitude,
        0,
        -Math.sin(angles.eccentricOrientation) * amplitude
      );
      // Retain the angular action of the 2D-M geometry while reflecting its
      // Earth-Moon radial action across the instantaneous lunar tangent.
      scaleRadialProjection(
        eccentricWorld,
        earthToMoonEcliptic,
        -1,
        eccentricWorld
      );
      localOffset
        .copy(eccentricWorld)
        .applyQuaternion(parentQuaternionInverse);
      eclipticOffsetInParentFrame(
        angles.variationOrientation,
        variationAmplitude,
        parentQuaternionInverse,
        variationOffset
      );
      localOffset.add(variationOffset);

      // Recover angular action from the former larger Deferent-A radius while
      // rejecting its radial action. The Deferent pivot-to-container vector is
      // the actual apsidal direction already generated by the hierarchy.
      const deferentContainer = parent.parent?.parent;
      if (deferentContainer && anomalisticTangentAmplitude !== 0) {
        parent.getWorldPosition(deferentPivotWorld);
        deferentContainer.getWorldPosition(deferentContainerWorld);
        anomalisticWorld
          .subVectors(deferentPivotWorld, deferentContainerWorld)
          .normalize()
          .multiplyScalar(anomalisticTangentAmplitude);
        tangentialProjection(
          anomalisticWorld,
          earthToMoonEcliptic,
          anomalisticWorld
        );
        anomalisticLocal
          .copy(anomalisticWorld)
          .applyQuaternion(parentQuaternionInverse);
        localOffset.add(anomalisticLocal);
      }
      offset.position.copy(localOffset);
      offset.updateWorldMatrix(true, true);
      return true;
    },
    [
      amplitude,
      anomalisticLocal,
      anomalisticTangentAmplitude,
      anomalisticWorld,
      deferentContainerWorld,
      deferentPivotWorld,
      eccentricWorld,
      earthToMoonEcliptic,
      earthToSunEcliptic,
      earthWorld,
      localOffset,
      moon,
      moonWorld,
      parentQuaternionInverse,
      plotMode,
      scene,
      sunWorld,
      targetName,
      variationAmplitude,
      variationOffset,
    ]
  );

  useFrame(() => update(posRef.current));

  useEffect(() => {
    if (!plotMode) return undefined;
    addPlotObj({ name: updaterName, updateAfterMotion: update });
    return () => removePlotObj(updaterName);
  }, [addPlotObj, plotMode, removePlotObj, update, updaterName]);

  if (
    !setting ||
    !variationSetting ||
    !anomalisticTangentSetting ||
    !moon
  ) {
    return null;
  }

  return (
    <group ref={offsetRef} name={`${targetName} Solar-Coupled Eccentric Offset`}>
      {children}
    </group>
  );
};

export default MoonSolarCoupledEccentric;
