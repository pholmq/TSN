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

export const EROS_SUN_RELATIVE_UPDATER_NAME =
  "Eros Native Relative Components";

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

export const createErosSunRelativeComponents = () => ({
  centreDifference: new Vector3(),
  annualCarrierMismatch: new Vector3(),
  deferentBStage: new Vector3(),
  mainBasis: new Matrix4(),
  nativeCarrier: createNativeRelativeCarrierState(),
  aOrientation: new Matrix4(),
  bOrientation: new Matrix4(),
  scratchMatrix: new Matrix4(),
  scratchVector: new Vector3(),
});

/**
 * Evaluate the native Sun-relative Eros chain. Deferent A stores a direct
 * relative centre, annual residual and local orientation basis. Deferent B and
 * the Eros leaf remain local geometric stages.
 */
export const updateErosSunRelativeComponents = (
  target,
  settingsByName,
  position
) => {
  const get = (id) =>
    settingsByName instanceof Map
      ? settingsByName.get(id)
      : settingsByName[id];
  const erosA = get("eros-deferent-a");
  const erosB = get("eros-deferent-b");

  updateNativeRelativeCarrier(target.nativeCarrier, erosA, position);
  target.centreDifference.copy(target.nativeCarrier.centre);
  target.annualCarrierMismatch.copy(target.nativeCarrier.annualResidual);
  target.aOrientation.copy(target.nativeCarrier.orientation);
  orbitalOrientation(
    erosB,
    position,
    target.bOrientation,
    target.scratchMatrix
  );
  // QA*(cB + QB*rB)
  target.deferentBStage
    .set(number(erosB, "orbitRadius"), 0, 0)
    .applyMatrix4(target.bOrientation);
  settingCenter(erosB, target.scratchVector);
  target.deferentBStage
    .add(target.scratchVector)
    .applyMatrix4(target.aOrientation);

  target.mainBasis.multiplyMatrices(
    target.aOrientation,
    target.bOrientation
  );
  return target;
};

/** Native parent-relative Eros branch. */
const ErosSunRelativeOrbit = ({ children, plotMode = false }) => {
  const settings = useSettingsStore((state) => state.settings);
  const settingsByName = useMemo(() => buildSettingsIndex(settings), [settings]);
  const components = useMemo(createErosSunRelativeComponents, []);
  const rootRef = useRef();
  const centreRef = useRef();
  const carrierRef = useRef();
  const deferentBRef = useRef();
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
      updateErosSunRelativeComponents(
        components,
        settingsByName,
        modelPosition
      );
      centreRef.current?.position.copy(components.centreDifference);
      carrierRef.current?.position.copy(components.annualCarrierMismatch);
      deferentBRef.current?.position.copy(components.deferentBStage);
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
      name: EROS_SUN_RELATIVE_UPDATER_NAME,
      updateAfterMotion: update,
    });
    return () => removePlotObj(EROS_SUN_RELATIVE_UPDATER_NAME);
  }, [addPlotObj, plotMode, removePlotObj, update]);

  return (
    <group
      ref={rootRef}
      name="Eros Native Relative Frame"
      matrixAutoUpdate={false}
    >
      <group ref={centreRef} name="Eros Parent-Relative Centre">
        <group ref={carrierRef} name="Eros Direct Annual Residual">
          <group ref={deferentBRef} name="Eros Deferent-B Stage">
            <group ref={mainBasisRef} name="Eros Main-Orbit Basis">
              {children}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

export default ErosSunRelativeOrbit;
