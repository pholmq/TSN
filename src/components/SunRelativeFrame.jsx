// src/components/SunRelativeFrame.jsx
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Matrix4, Vector3 } from "three";
import { usePlotStore } from "../store";

const SunRelativeFrame = ({ name, referenceFrame, plotMode = false, children }) => {
  const ref = useRef();
  const add = usePlotStore((state) => state.addPlotObj);
  const remove = usePlotStore((state) => state.removePlotObj);
  const { scene } = useThree();

  const scratch = useMemo(() => ({ 
    inverse: new Matrix4(), 
    world: new Matrix4(), 
    position: new Vector3() 
  }), []);

  const update = useCallback(() => {
    const root = ref.current;
    const parent = root?.parent;
    
    // Safety check: Warns you if the JSON is misconfigured instead of failing silently!
    if (!referenceFrame) {
      console.warn(`SunRelativeFrame on ${name} is missing 'referenceFrame' in celestial-model.json`);
      return;
    }
    if (!parent) return;

    let frame;
    if (plotMode) {
      const objects = usePlotStore.getState().plotObjects;
      frame = objects.find((item) => item.name === referenceFrame)?.pivotRef?.current;
    } else {
      // Look up the dynamically named Pivot group of the reference frame
      frame = scene.getObjectByName(`${referenceFrame}-Pivot`);
    }

    if (!frame) return;

    parent.updateWorldMatrix(true, false);
    frame.updateWorldMatrix(true, false);
    
    parent.getWorldPosition(scratch.position);
    scratch.world.copy(frame.matrixWorld).setPosition(scratch.position);
    
    root.matrix.multiplyMatrices(scratch.inverse.copy(parent.matrixWorld).invert(), scratch.world);
    root.matrixWorldNeedsUpdate = true;
  }, [scratch, referenceFrame, plotMode, scene, name]);

  useFrame(() => { 
    if (!plotMode) update(); 
  }, -1);

  useEffect(() => {
    if (!plotMode) return undefined;
    const updaterName = `Sun-relative frame: ${name}`;
    add({ name: updaterName, updateAfterMotion: update, updatePriority: -2 });
    return () => remove(updaterName);
  }, [add, name, plotMode, remove, update]);

  return (
    <group ref={ref} matrixAutoUpdate={false}>
      {children}
    </group>
  );
};

export default SunRelativeFrame;