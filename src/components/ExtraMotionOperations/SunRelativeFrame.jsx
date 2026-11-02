import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Vector3 } from "three";
import { usePlotStore } from "../../store";

const SunRelativeFrame = ({ name, referenceFrame, plotMode = false, children }) => {
  const ref = useRef();
  const add = usePlotStore((state) => state.addPlotObj);
  const remove = usePlotStore((state) => state.removePlotObj);

  const scratch = useMemo(() => ({ 
    inverse: new Matrix4(), 
    world: new Matrix4(), 
    position: new Vector3() 
  }), []);

  const update = useCallback(() => {
    const root = ref.current;
    const parent = root?.parent;
    if (!parent || !referenceFrame) return;

    let frame = parent;
    const targetName = `${referenceFrame}-Pivot`; 
    while (frame && frame.name !== targetName) frame = frame.parent;
    
    if (!frame) return;

    parent.updateWorldMatrix(true, false);
    frame.updateWorldMatrix(true, false);
    
    parent.getWorldPosition(scratch.position);
    scratch.world.copy(frame.matrixWorld).setPosition(scratch.position);
    
    root.matrix.multiplyMatrices(scratch.inverse.copy(parent.matrixWorld).invert(), scratch.world);
    root.matrixWorldNeedsUpdate = true;
  }, [scratch, referenceFrame]);

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