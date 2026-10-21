import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, Quaternion, Vector3 } from "three";
import { usePlotStore, useSettingsStore, useStore } from "../store";
import { celestialModel } from "../utils/celestialModel";

const D2R = Math.PI / 180;
const number = (value) => Number(value) || 0;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function equantCorrection(angle, radius, offset, orientation = 0) {
  radius = Math.abs(number(radius));
  if (!radius || !offset) return 0;
  const projection = offset * Math.cos(angle - orientation);
  const discriminant = projection * projection + radius * radius - offset * offset;
  if (discriminant < 0) return 0;
  const distance = -projection + Math.sqrt(discriminant);
  return wrap(Math.atan2(offset * Math.sin(orientation) + distance * Math.sin(angle),
    offset * Math.cos(orientation) + distance * Math.cos(angle)) - angle);
}

// Dynamically resolve target settings from celestial-model IDs
const getSettingById = (id, settings) => {
  const modelObj = celestialModel.objects.find((o) => o.id === id);
  return modelObj ? settings.find((s) => s.name === modelObj.name) : null;
};

// Isolated Strategy Map for distinct astronomical operations
const Operations = {
  "moving-eccentric-centre": (group, time, p, setting) => {
    const angle = number(setting.speed) * time - number(setting.startPos) * D2R;
    group.position.set(
      Math.cos(angle) * number(setting.orbitRadius), 
      0, 
      -Math.sin(angle) * number(setting.orbitRadius)
    );
  },

  "off-centre-phase": (group, time, p, setting, settings) => {
    const target = getSettingById(setting.targetId, settings);
    if (!target) return;
    group.rotation.y = equantCorrection(
      number(target.speed) * time - number(target.startPos) * D2R,
      target.orbitRadius, 
      number(p.offset), 
      number(setting.startPos) * D2R
    );
    group.updateWorldMatrix(true, true);
  },

  "axial-annual-centre-oscillation": (group, time, p, setting, settings, scratch) => {
    const target = getSettingById(setting.targetId, settings);
    if (!target) return;
    
    group.position.set(number(p.axisX), number(p.axisY), number(p.axisZ));
    if (group.position.lengthSq()) {
      group.position.normalize().multiplyScalar(number(p.amplitude) * Math.cos(number(p.speed) * time - number(p.phase) * D2R));
    }
    
    // Resolve carrier orientation dynamically
    const carrier = getSettingById(setting.parentId, settings);
    if (carrier) {
      const q = scratch.inverse.setFromEuler(new Euler(number(carrier.orbitTiltx) * D2R, 0, number(carrier.orbitTiltz) * D2R));
      q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), number(carrier.speed) * time - number(carrier.startPos) * D2R)).invert();
      group.position.applyQuaternion(q);
    }
  },

  "solar-coupled-centre-offset": (group, time, p, setting, settings, scratch, scene, plotMode) => {
    const objects = usePlotStore.getState().plotObjects;
    const find = (id) => {
      const targetSetting = getSettingById(id, settings);
      if (!targetSetting) return null;
      return plotMode 
        ? objects.find((item) => item.name === targetSetting.name)?.pivotRef?.current 
        : scene.getObjectByName(targetSetting.name);
    };

    const earth = find(setting.referenceIds?.observer);
    const sun = find(setting.referenceIds?.reference);
    const target = find(setting.targetId);
    const targetSetting = getSettingById(setting.targetId, settings);

    if (!earth || !sun || !target || !targetSetting || !group.parent) return;

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

    reflected(longitude + 2 * elongation - anomaly, number(p.inequalityRadius), scratch.offset);
    reflected(longitude + 2 * elongation, number(p.variationRadius), scratch.part);

    scratch.offset.add(scratch.part);
    group.parent.getWorldQuaternion(scratch.inverse).invert();
    group.position.copy(scratch.offset).applyQuaternion(scratch.inverse);
    group.updateWorldMatrix(true, true);
  }
};

const MotionOperation = ({ name, operation, plotMode = false, children }) => {
  const ref = useRef();
  const settings = useSettingsStore((state) => state.settings);
  const position = useStore((state) => state.posRef);
  const { scene } = useThree();
  const add = usePlotStore((state) => state.addPlotObj);
  const remove = usePlotStore((state) => state.removePlotObj);
  
  const scratch = useMemo(() => ({ 
    earth: new Vector3(), sun: new Vector3(), moon: new Vector3(),
    direction: new Vector3(), offset: new Vector3(), part: new Vector3(), inverse: new Quaternion() 
  }), []);

  const setting = settings.find((item) => item.name === name);

  const update = useCallback((time) => {
    const group = ref.current;
    if (!group || !setting) return;
    const p = setting.operationParameters || {};
    
    const operationFn = Operations[operation];
    if (operationFn) {
      operationFn(group, time, p, setting, settings, scratch, scene, plotMode);
    }
  }, [operation, plotMode, scene, scratch, setting, settings]);

  useFrame(() => { 
    if (!plotMode) update(position.current || 0); 
  }, operation === "off-centre-phase" ? -1 : 0);

  useEffect(() => {
    if (!plotMode) return undefined;
    const updaterName = `Operation: ${name}`;
    add({ name: updaterName, updateAfterMotion: update, updatePriority: operation === "off-centre-phase" ? -1 : 0 });
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