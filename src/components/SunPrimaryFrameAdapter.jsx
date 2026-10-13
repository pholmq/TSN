import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4 } from "three";
import { usePlotStore } from "../store";

export const SUN_MARS_FRAME_NAME = "Sun-Mars Binary Frame";
export const SUN_PRIMARY_ADAPTER_NAME = "Sun Primary Coordinate Adapter";

/**
 * Cancel the transforms inherited between the named system frame and this
 * adapter's parent. Descendants then use the system frame as their effective
 * coordinate parent even though they are structurally nested under the Sun.
 */
export const updateFrameCompensation = (
  adapter,
  frameName = SUN_MARS_FRAME_NAME,
  inverseParent = new Matrix4()
) => {
  const parent = adapter?.parent;
  if (!parent) return false;

  let frame = parent;
  while (frame && frame.name !== frameName) frame = frame.parent;
  if (!frame) return false;

  parent.updateWorldMatrix(true, false);
  frame.updateWorldMatrix(true, false);
  inverseParent.copy(parent.matrixWorld).invert();
  adapter.matrix.multiplyMatrices(inverseParent, frame.matrixWorld);
  adapter.matrixWorldNeedsUpdate = true;
  return true;
};

const SunPrimaryFrameAdapter = ({ children, plotMode = false }) => {
  const adapterRef = useRef();
  const inverseParent = useMemo(() => new Matrix4(), []);
  const addPlotObj = usePlotStore((state) => state.addPlotObj);
  const removePlotObj = usePlotStore((state) => state.removePlotObj);

  const update = useCallback(
    () =>
      updateFrameCompensation(
        adapterRef.current,
        SUN_MARS_FRAME_NAME,
        inverseParent
      ),
    [inverseParent]
  );

  useFrame(update);

  useEffect(() => {
    if (!plotMode) return undefined;
    addPlotObj({
      name: SUN_PRIMARY_ADAPTER_NAME,
      updateAfterMotion: update,
    });
    return () => removePlotObj(SUN_PRIMARY_ADAPTER_NAME);
  }, [addPlotObj, plotMode, removePlotObj, update]);

  return (
    <group
      ref={adapterRef}
      name={SUN_PRIMARY_ADAPTER_NAME}
      matrixAutoUpdate={false}
    >
      {children}
    </group>
  );
};

export default SunPrimaryFrameAdapter;
