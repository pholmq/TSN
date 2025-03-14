import { useEffect, useRef } from "react";
import { Line } from "@react-three/drei";
import useFrameInterval from "../../utils/useFrameInterval";

const TraceLine = ({
  pointsArrRef,
  traceLength,
  color,
  dots,
  lineWidth,
  interval,
}) => {
  // Note: Animating lines in Three.js is tricky. The array that geometry.setPositions receive
  // must be a Float32 array of the same length and be filled [x,y,z,x,y,z...] .
  // So to acheive a line that becomes progessively longer we fill the array with zeroes
  // and then increase geometry.instanceCount that sets how many points in the array that is
  // actually drawn.

  const float32arr = new Float32Array(traceLength * 3); //xyz for each point
  float32arr.fill(0);
  const line2Ref = useRef(null);
  // const { invalidate } = useThree();

  //If lineWidth is negative the line becomes dotted
  const width = dots ? -lineWidth : lineWidth;

  useFrameInterval(
    () => {
      float32arr.set(pointsArrRef.current);
      line2Ref.current.geometry.setPositions(float32arr);
      line2Ref.current.geometry.instanceCount =
        (pointsArrRef.current.length - 1) / 3;
    },
    interval,
    true
  );

  // invalidate();
  return (
    <Line
      ref={line2Ref}
      points={[...float32arr]}
      lineWidth={width}
      color={color}
    ></Line>
  );
};

export default TraceLine;
