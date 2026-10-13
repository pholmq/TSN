import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Vector3 } from "three";
import { usePlotStore, useSettingsStore, useStore } from "../store";
import { buildSettingsIndex } from "../utils/celestialSettingsSchema";
import {
  createNativeRelativeCarrierState,
  updateNativeRelativeCarrier,
} from "../utils/nativeRelativeCarrier";
import {
  SUN_MARS_FRAME_NAME,
  updateSunRelativeFrame,
} from "./SunMarsRelativeOrbit";

export const MERCURY_SUN_RELATIVE_UPDATER_NAME =
  "Mercury Native Relative Components";

const D2R = Math.PI / 180;
const number = (setting, key) => Number(setting?.[key] || 0);

const settingCenter = (setting, target) =>
  target.set(
    number(setting, "orbitCentera"),
    number(setting, "orbitCenterc"),
    number(setting, "orbitCenterb")
  );

const orbitalOrientation = (setting, position, target, scratch) => {
  target.makeRotationX(number(setting, "orbitTilta") * D2R);
  scratch.makeRotationZ(number(setting, "orbitTiltb") * D2R);
  target.multiply(scratch);
  scratch.makeRotationY(
    number(setting, "speed") * position -
      number(setting, "startPos") * D2R
  );
  target.multiply(scratch);
  return target;
};

export const createMercurySunRelativeComponents = () => ({
  centreDifference: new Vector3(),
  annualCarrierMismatch: new Vector3(),
  deferentBStage: new Vector3(),
  planeStage: new Vector3(),
  mainBasis: new Matrix4(),
  nativeCarrier: createNativeRelativeCarrierState(),
  aOrientation: new Matrix4(),
  bOrientation: new Matrix4(),
  planeOrientation: new Matrix4(),
  abBasis: new Matrix4(),
  scratchMatrix: new Matrix4(),
  scratchVector: new Vector3(),
});

/**
 * Evaluate the native Sun-relative Mercury chain.
 *
 * Mercury deferent A now stores a direct relative centre, annual residual and
 * local orientation basis instead of an absolute radius-100 carrier. Deferent B,
 * the fixed plane and the Mercury leaf remain local geometric stages.
 */
export const updateMercurySunRelativeComponents = (
  target,
  settingsByName,
  position
) => {
  const get = (id) =>
    settingsByName instanceof Map
      ? settingsByName.get(id)
      : settingsByName[id];
  const mercuryA = get("mercury-deferent-a");
  const mercuryB = get("mercury-deferent-b");
  const mercuryPlane = get("mercury-plane");

  updateNativeRelativeCarrier(target.nativeCarrier, mercuryA, position);
  target.centreDifference.copy(target.nativeCarrier.centre);
  target.annualCarrierMismatch.copy(target.nativeCarrier.annualResidual);
  target.aOrientation.copy(target.nativeCarrier.orientation);
  orbitalOrientation(
    mercuryB,
    position,
    target.bOrientation,
    target.scratchMatrix
  );
  orbitalOrientation(
    mercuryPlane,
    position,
    target.planeOrientation,
    target.scratchMatrix
  );
  // QA*(cB + QB*rB). The zero rB does not remove the transformed cB.
  target.deferentBStage
    .set(number(mercuryB, "orbitRadius"), 0, 0)
    .applyMatrix4(target.bOrientation);
  settingCenter(mercuryB, target.scratchVector);
  target.deferentBStage
    .add(target.scratchVector)
    .applyMatrix4(target.aOrientation);

  // QA*QB*(cPlane + QPlane*rPlane)
  target.planeStage
    .set(number(mercuryPlane, "orbitRadius"), 0, 0)
    .applyMatrix4(target.planeOrientation);
  settingCenter(mercuryPlane, target.scratchVector);
  target.planeStage
    .add(target.scratchVector)
    .applyMatrix4(target.bOrientation)
    .applyMatrix4(target.aOrientation);

  target.abBasis.multiplyMatrices(
    target.aOrientation,
    target.bOrientation
  );
  target.mainBasis.multiplyMatrices(
    target.abBasis,
    target.planeOrientation
  );
  return target;
};

/** Native parent-relative Mercury branch. */
const MercurySunRelativeOrbit = ({ children, plotMode = false }) => {
  const settings = useSettingsStore((state) => state.settings);
  const settingsByName = useMemo(() => buildSettingsIndex(settings), [settings]);
  const components = useMemo(createMercurySunRelativeComponents, []);
  const rootRef = useRef();
  const centreRef = useRef();
  const carrierRef = useRef();
  const deferentBRef = useRef();
  const planeRef = useRef();
  const mainBasisRef = useRef();
  const inverseParent = useMemo(() => new Matrix4(), []);
  const desiredWorld = useMemo(() => new Matrix4(), []);
  const sunWorld = useMemo(() => new Vector3(), []);
  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);
  const posRef = useStore((state) => state.posRef);

  const update = useCallback(
    (position) => {
      const modelPosition = Number.isFinite(position) ? position : 0;
      updateMercurySunRelativeComponents(
        components,
        settingsByName,
        modelPosition
      );
      centreRef.current?.position.copy(components.centreDifference);
      carrierRef.current?.position.copy(components.annualCarrierMismatch);
      deferentBRef.current?.position.copy(components.deferentBStage);
      planeRef.current?.position.copy(components.planeStage);
      mainBasisRef.current?.quaternion.setFromRotationMatrix(
        components.mainBasis
      );
      return updateSunRelativeFrame(
        rootRef.current,
        SUN_MARS_FRAME_NAME,
        inverseParent,
        desiredWorld,
        sunWorld
      );
    },
    [components, desiredWorld, inverseParent, settingsByName, sunWorld]
  );

  useFrame(() => update(posRef.current));

  useEffect(() => {
    if (!plotMode) return undefined;
    addPlotObj({
      name: MERCURY_SUN_RELATIVE_UPDATER_NAME,
      updateAfterMotion: update,
    });
    return () => removePlotObj(MERCURY_SUN_RELATIVE_UPDATER_NAME);
  }, [addPlotObj, plotMode, removePlotObj, update]);

  return (
    <group
      ref={rootRef}
      name="Mercury Native Relative Frame"
      matrixAutoUpdate={false}
    >
      <group ref={centreRef} name="Mercury Parent-Relative Centre">
        <group ref={carrierRef} name="Mercury Direct Annual Residual">
          <group ref={deferentBRef} name="Mercury Deferent-B Stage">
            <group ref={planeRef} name="Mercury Fixed-Plane Stage">
              <group ref={mainBasisRef} name="Mercury Main-Orbit Basis">
                {children}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

export default MercurySunRelativeOrbit;
