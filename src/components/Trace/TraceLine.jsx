import { useRef, useMemo } from "react";
import { Line } from "@react-three/drei";
import { Color } from "three";
import useFrameInterval from "../../utils/useFrameInterval";

const TraceLine = ({
  pointsArrRef,
  pointCountRef,
  traceLength,
  color,
  dots,
  lineWidth,
  interval,
}) => {
  const line2Ref = useRef(null);

  const baseColor = useMemo(() => new Color(color), [color]);

  // FIX: Reverted to standard Array. Drei requires a standard Array for the 'points' prop
  // on initial mount because it uses Array.prototype.flat() internally.
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

      // pts here is the Float32Array from Trace.jsx
      const pts = pointsArrRef.current;

      const numPoints = pointCountRef.current;
      const segmentCount = Math.max(0, numPoints - 1);

      if (segmentCount === 0) {
        line2Ref.current.geometry.instanceCount = 0;
        return;
      }

      const geometry = line2Ref.current.geometry;

      const iStart = geometry.attributes.instanceStart;
      const cStart = geometry.attributes.instanceColorStart;

      if (!iStart || !cStart) return;

      // These are the raw WebGL Float32Arrays
      const positionBuffer = iStart.data;
      const colorBuffer = cStart.data;

      const posArr = positionBuffer.array;
      const colArr = colorBuffer.array;

      const fadeLen = 20;
      const effectiveFade = Math.max(
        1,
        Math.min(fadeLen, Math.floor(numPoints / 2))
      );

      for (let i = 0; i < segmentCount; i++) {
        const bufferIdx = i * 6;
        const ptIdx = i * 3;

        // Writing our internal Float32Array directly into the WebGL Float32Array
        posArr[bufferIdx] = pts[ptIdx];
        posArr[bufferIdx + 1] = pts[ptIdx + 1];
        posArr[bufferIdx + 2] = pts[ptIdx + 2];

        posArr[bufferIdx + 3] = pts[ptIdx + 3];
        posArr[bufferIdx + 4] = pts[ptIdx + 4];
        posArr[bufferIdx + 5] = pts[ptIdx + 5];

        let alphaStart = 1.0;
        let alphaEnd = 1.0;

        if (i < effectiveFade) {
          alphaStart = i / effectiveFade;
          alphaEnd = (i + 1) / effectiveFade;
        } else if (i >= numPoints - effectiveFade - 1) {
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

      positionBuffer.needsUpdate = true;
      colorBuffer.needsUpdate = true;

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
