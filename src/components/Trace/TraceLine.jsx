import { useRef, useMemo } from "react";
import { Line } from "@react-three/drei";
import { Color } from "three";
import useFrameInterval from "../../utils/useFrameInterval";

const TraceLine = ({
  pointsArrRef,
  traceLength,
  color,
  dots,
  lineWidth,
  interval,
}) => {
  const line2Ref = useRef(null);

  // Parse the base color once
  const baseColor = useMemo(() => new Color(color), [color]);

  // OPTIMIZATION: Create buffers ONCE and reuse them.

  // 1. Positions Buffer
  const float32arr = useMemo(() => {
    const arr = new Float32Array(traceLength * 3);
    arr.fill(0);
    return arr;
  }, [traceLength]);

  // 2. Colors Buffer
  const colorsFloat32 = useMemo(() => {
    const arr = new Float32Array(traceLength * 3);
    // Initialize with the base color (or black)
    const r = baseColor.r;
    const g = baseColor.g;
    const b = baseColor.b;
    for (let i = 0; i < traceLength; i++) {
      arr[i * 3] = r;
      arr[i * 3 + 1] = g;
      arr[i * 3 + 2] = b;
    }
    return arr;
  }, [traceLength, baseColor]);

  // FIX: Create standard Arrays for 'drei' initialization to prevent crashes
  const initialPoints = useMemo(() => Array.from(float32arr), [float32arr]);
  const initialColors = useMemo(
    () => Array.from(colorsFloat32),
    [colorsFloat32]
  );

  // If lineWidth is negative the line becomes dotted
  const width = dots ? -lineWidth : lineWidth;

  useFrameInterval(
    () => {
      // Safety check
      if (!pointsArrRef.current || !line2Ref.current) return;

      const currentPoints = pointsArrRef.current;
      const numPoints = currentPoints.length / 3;

      // --- 1. Update Positions ---
      float32arr.set(currentPoints);
      line2Ref.current.geometry.setPositions(float32arr);

      // --- 2. Update Colors (Gradient Fading) ---
      // Number of vertices to fade at each end
      const fadeLen = 20;
      // Ensure we don't fade more than half the line (prevents overlap on short lines)
      const effectiveFade = Math.max(
        1,
        Math.min(fadeLen, Math.floor(numPoints / 2))
      );

      for (let i = 0; i < numPoints; i++) {
        let alpha = 1.0;

        // Tail Fade (Oldest points - index 0)
        if (i < effectiveFade) {
          alpha = i / effectiveFade;
        }
        // Head Fade (Newest points - index end)
        else if (i > numPoints - effectiveFade) {
          alpha = (numPoints - i) / effectiveFade;
        }

        // Apply alpha to RGB (Fade to black simulation)
        const idx = i * 3;
        colorsFloat32[idx] = baseColor.r * alpha;
        colorsFloat32[idx + 1] = baseColor.g * alpha;
        colorsFloat32[idx + 2] = baseColor.b * alpha;
      }

      line2Ref.current.geometry.setColors(colorsFloat32);

      // --- 3. Update Instance Count ---
      const segmentCount = (currentPoints.length - 1) / 3;
      line2Ref.current.geometry.instanceCount = Math.max(0, segmentCount);
    },
    interval,
    true
  );

  return (
    <Line
      ref={line2Ref}
      points={initialPoints}
      vertexColors={initialColors} // Initialize with vertex colors enabled
      lineWidth={width}
      color="white" // Base color must be white for vertex colors to tint correctly
    />
  );
};

export default TraceLine;
