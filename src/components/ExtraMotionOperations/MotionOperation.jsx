import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, Quaternion, Vector3 } from "three";
import { usePlotStore, useSettingsStore, useStore } from "../../store";
import { celestialModel } from "../../utils/celestialModel";

const D2R = Math.PI / 180;
const DISPLAY_MOON_SCALE = 39.2078;
const number = (value) => Number(value) || 0;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

const getSettingById = (id, settings) => {
  const modelObj = celestialModel.objects.find((o) => o.id === id);
  return modelObj ? settings.find((s) => s.name === modelObj.name) : null;
};

const Operations = {
  "moving-eccentric-centre": (group, time, p, setting) => {
    const angle = number(setting.speed) * time - number(setting.startPos) * D2R;
    group.position.set(
      Math.cos(angle) * number(setting.orbitRadius), 
      0, 
      -Math.sin(angle) * number(setting.orbitRadius)
    );
  },

  "axial-annual-centre-oscillation": (group, time, p, setting, settings, scratch) => {
    const target = getSettingById(setting.targetId, settings);
    if (!target) return;
    
    group.position.set(number(p.axisX), number(p.axisY), number(p.axisZ));
    if (group.position.lengthSq()) {
      group.position.normalize().multiplyScalar(number(p.amplitude) * Math.cos(number(p.speed) * time - number(p.phase) * D2R));
    }
    
    const carrier = getSettingById(setting.parentId, settings);
    if (carrier) {
      const q = scratch.inverse.setFromEuler(new Euler(number(carrier.orbitTiltx) * D2R, 0, number(carrier.orbitTiltz) * D2R));
      q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), number(carrier.speed) * time - number(carrier.startPos) * D2R)).invert();
      group.position.applyQuaternion(q);
    }
  },

  "solar-coupled-centre-offset": (group, time, p, setting, settings, scratch, scene, plotMode, displayScale = 1) => {
    const objects = usePlotStore.getState().plotObjects;
    const find = (nameStr) => {
      if (!nameStr) return null;
      return plotMode 
        ? objects.find((item) => item.name === nameStr)?.pivotRef?.current 
        : scene.getObjectByName(nameStr);
    };

    const observerSetting = getSettingById(setting.referenceIds?.observer, settings);
    const referenceSetting = getSettingById(setting.referenceIds?.reference, settings);
    const targetSetting = getSettingById(setting.targetId, settings);

    if (!observerSetting || !referenceSetting || !targetSetting) return;

    const earth = find(observerSetting.name);
    const sun = find(referenceSetting.name);
    const target = find(targetSetting.name);

    if (!earth || !sun || !target || !group.parent) return;

    group.position.set(0, 0, 0);
    group.parent.updateWorldMatrix(true, true);
    
    earth.getWorldPosition(scratch.earth); 
    sun.getWorldPosition(scratch.sun); 
    target.getWorldPosition(scratch.moon);

    scratch.direction.subVectors(scratch.moon, scratch.earth);
    scratch.sun.sub(scratch.earth);
    
    if (!scratch.direction.lengthSq() || !scratch.sun.lengthSq()) return;

    const longitude = Math.atan2(-scratch.direction.z, scratch.direction.x);
    const elongation = wrap(longitude - Math.atan2(-scratch.sun.z, scratch.sun.x));
    const anomaly = number(targetSetting.speed) * time - number(targetSetting.startPos) * D2R;

    const reflected = (angle, amplitude, targetVec) => {
      targetVec.set(Math.cos(angle) * amplitude, 0, -Math.sin(angle) * amplitude);
      targetVec.addScaledVector(scratch.direction, -2 * targetVec.dot(scratch.direction) / scratch.direction.lengthSq());
    };

    reflected(longitude + 2 * elongation - anomaly, number(p.inequalityRadius) * displayScale, scratch.offset);
    reflected(longitude + 2 * elongation, number(p.variationRadius) * displayScale, scratch.part);

    scratch.offset.add(scratch.part);
    // The paired radial action replaces the retired lunar equant. It is
    // constructed in the apsidal parent's local XZ plane and transformed back
    // to world space, so it follows the nodal/apsidal lunar plane rather than
    // the fixed model XZ plane.
    const pairedRadius = number(p.pairedRadialRadius) * displayScale;
    if (pairedRadius && group.parent) {
      group.parent.getWorldQuaternion(scratch.parentQuaternion);
      scratch.localMoon.copy(scratch.direction)
        .applyQuaternion(scratch.parentInverse.copy(scratch.parentQuaternion).invert());
      const moonAngle = Math.atan2(-scratch.localMoon.z, scratch.localMoon.x);
      const secondAngle = 2 * moonAngle;
      scratch.paired.set(
        pairedRadius * (1 + Math.cos(secondAngle)),
        0,
        -pairedRadius * Math.sin(secondAngle)
      ).applyQuaternion(scratch.parentQuaternion);
      scratch.offset.add(scratch.paired);
    }
    group.parent.getWorldQuaternion(scratch.inverse).invert();
    group.position.copy(scratch.offset).applyQuaternion(scratch.inverse);
    group.updateWorldMatrix(true, true);
  }
};

const MotionOperation = ({ name, operation, plotMode = false, children }) => {
  const ref = useRef();
  const settings = useSettingsStore((state) => state.settings);
  const position = useStore((state) => state.posRef);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const { scene } = useThree();
  const add = usePlotStore((state) => state.addPlotObj);
  const remove = usePlotStore((state) => state.removePlotObj);
  
  const scratch = useMemo(() => ({ 
    earth: new Vector3(), sun: new Vector3(), moon: new Vector3(),
    direction: new Vector3(), offset: new Vector3(), part: new Vector3(),
    paired: new Vector3(), localMoon: new Vector3(), inverse: new Quaternion(),
    parentQuaternion: new Quaternion(), parentInverse: new Quaternion()
  }), []);

  const setting = settings.find((item) => item.name === name);

  const update = useCallback((time) => {
    const group = ref.current;
    if (!group || !setting) return;
    const p = setting.operationParameters || {};
    
    const operationFn = Operations[operation];
    if (operationFn) {
      const displayScale =
        operation === "solar-coupled-centre-offset" && !actualPlanetSizes
          ? DISPLAY_MOON_SCALE
          : 1;
      operationFn(group, time, p, setting, settings, scratch, scene, plotMode, displayScale);
    }
  }, [actualPlanetSizes, operation, plotMode, scene, scratch, setting, settings]);

  useFrame(() => { 
    if (!plotMode) update(position.current || 0); 
  }, 0);

  useEffect(() => {
    if (!plotMode) return undefined;
    const updaterName = `Operation: ${name}`;
    add({ name: updaterName, updateAfterMotion: update, updatePriority: 0 });
    return () => remove(updaterName);
  }, [add, remove, name, operation, plotMode, update]);

  if (operation === "moving-eccentric-centre") {
    return (
      <group position={[number(setting?.orbitCenterx), number(setting?.orbitCentery), number(setting?.orbitCenterz)]} 
             rotation={[number(setting?.orbitTiltx) * D2R, 0, number(setting?.orbitTiltz) * D2R]}>
        <group ref={ref} name={name}>{children}</group>
      </group>
    );
  }

  return <group ref={ref} name={name}>{children}</group>;
};

export default MotionOperation;
