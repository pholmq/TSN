import { Matrix4, Vector3 } from "three";

const D2R = Math.PI / 180;
const number = (setting, key) => Number(setting?.[key] || 0);

export const NATIVE_RELATIVE_ANNUAL_PROPERTIES = [
  "relativeAnnualStart",
  "relativeAnnualSpeed",
  "relativeAnnualCosX",
  "relativeAnnualCosY",
  "relativeAnnualCosZ",
  "relativeAnnualSinX",
  "relativeAnnualSinY",
  "relativeAnnualSinZ",
];

export const hasNativeRelativeCarrier = (setting) => Boolean(setting);

export const createNativeRelativeCarrierState = () => ({
  centre: new Vector3(),
  annualResidual: new Vector3(),
  orientation: new Matrix4(),
  scratchMatrix: new Matrix4(),
  cosineBasis: new Vector3(),
  sineBasis: new Vector3(),
});

/**
 * Evaluate a direct parent-relative carrier.
 *
 * The setting stores no absolute parent-sized orbit. Its centre is already
 * parent-relative, the annual remainder is a 3-D harmonic basis, and the normal
 * orbital fields retain only the orientation used by the local descendant chain.
 */
export const updateNativeRelativeCarrier = (state, setting, position) => {
  if (!setting) {
    throw new Error(
      `Setting '${setting?.id || setting?.name}' is not a native relative carrier`
    );
  }

  state.centre.set(
    number(setting, "orbitCentera"),
    number(setting, "orbitCenterc"),
    number(setting, "orbitCenterb")
  );

  const angle =
    number(setting, "relativeAnnualSpeed") * position -
    number(setting, "relativeAnnualStart") * D2R;
  state.cosineBasis.set(
    number(setting, "relativeAnnualCosX"),
    number(setting, "relativeAnnualCosY"),
    number(setting, "relativeAnnualCosZ")
  );
  state.sineBasis.set(
    number(setting, "relativeAnnualSinX"),
    number(setting, "relativeAnnualSinY"),
    number(setting, "relativeAnnualSinZ")
  );
  state.annualResidual
    .copy(state.cosineBasis)
    .multiplyScalar(Math.cos(angle))
    .addScaledVector(state.sineBasis, Math.sin(angle));

  state.orientation.makeRotationX(number(setting, "orbitTilta") * D2R);
  state.scratchMatrix.makeRotationZ(number(setting, "orbitTiltb") * D2R);
  state.orientation.multiply(state.scratchMatrix);
  state.scratchMatrix.makeRotationY(
    number(setting, "speed") * position -
      number(setting, "startPos") * D2R
  );
  state.orientation.multiply(state.scratchMatrix);
  return state;
};
