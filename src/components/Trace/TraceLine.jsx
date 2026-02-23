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

  const baseColor = useMemo(() => new Color(color), [color]);

  // Provide initial full-length arrays so Drei pre-allocates the max WebGL buffer ONCE
  const initialPoints = useMemo(
    () => new Array(traceLength * 3).fill(0),
    [traceLength]
  );
  const initialColors = useMemo(() => {
    const arr = new Array(traceLength * 3);
    for (let i = 0; i < traceLength; i++) {
      arr[i * 3] = baseColor.r;
      arr[i * 3 + 1] = baseColor.g;
      arr[i * 3 + 2] = baseColor.b;
    }
    return arr;
  }, [traceLength, baseColor]);

  const width = dots ? -lineWidth : lineWidth;

  useFrameInterval(
    () => {
      if (!pointsArrRef.current || !line2Ref.current) return;

      const pts = pointsArrRef.current;
      const numPoints = Math.floor(pts.length / 3);
      const segmentCount = Math.max(0, numPoints - 1);

      if (segmentCount === 0) {
        line2Ref.current.geometry.instanceCount = 0;
        return;
      }

      const geometry = line2Ref.current.geometry;

      // Drei's LineGeometry uses InstancedInterleavedBuffers.
      // instanceStart and instanceEnd share the SAME buffer.
      const iStart = geometry.attributes.instanceStart;
      const cStart = geometry.attributes.instanceColorStart;

      if (!iStart || !cStart) return;

      // Access the underlying shared buffer arrays
      const positionBuffer = iStart.data;
      const colorBuffer = cStart.data;

      const posArr = positionBuffer.array;
      const colArr = colorBuffer.array;

      const fadeLen = 20;
      const effectiveFade = Math.max(
        1,
        Math.min(fadeLen, Math.floor(numPoints / 2))
      );

      // Directly write into the interleaved buffer (6 floats per segment: Start XYZ, End XYZ)
      for (let i = 0; i < segmentCount; i++) {
        const bufferIdx = i * 6; // Index in the interleaved buffer
        const ptIdx = i * 3; // Index in our raw points array

        // --- 1. Positions (Start XYZ, End XYZ) ---
        posArr[bufferIdx] = pts[ptIdx];
        posArr[bufferIdx + 1] = pts[ptIdx + 1];
        posArr[bufferIdx + 2] = pts[ptIdx + 2];

        posArr[bufferIdx + 3] = pts[ptIdx + 3];
        posArr[bufferIdx + 4] = pts[ptIdx + 4];
        posArr[bufferIdx + 5] = pts[ptIdx + 5];

        // --- 2. Colors and Fading ---
        let alphaStart = 1.0;
        let alphaEnd = 1.0;

        // Tail Fade (Oldest points)
        if (i < effectiveFade) {
          alphaStart = i / effectiveFade;
          alphaEnd = (i + 1) / effectiveFade;
        }
        // Head Fade (Newest points)
        else if (i >= numPoints - effectiveFade - 1) {
          alphaStart = (numPoints - i) / effectiveFade;
          alphaEnd = (numPoints - (i + 1)) / effectiveFade;
        }

        colArr[bufferIdx] = baseColor.r * alphaStart;
        colArr[bufferIdx + 1] = baseColor.g * alphaStart;
        colArr[bufferIdx + 2] = baseColor.b * alphaStart;

        colArr[bufferIdx + 3] = baseColor.r * alphaEnd;
        colArr[bufferIdx + 4] = baseColor.g * alphaEnd;
        colArr[bufferIdx + 5] = baseColor.b * alphaEnd;
      }

      // --- 3. Flag the buffers, not the attributes, for GPU upload ---
      positionBuffer.needsUpdate = true;
      colorBuffer.needsUpdate = true;

      // Ensure Three.js only draws the active segments
      geometry.instanceCount = segmentCount;
    },
    interval,
    true
  );

  return (
    <Line
      ref={line2Ref}
      points={initialPoints}
      vertexColors={initialColors}
      lineWidth={width}
      color="white"
      frustumCulled={false}
    />
  );
};

export default TraceLine;
