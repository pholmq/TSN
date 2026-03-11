// Stars.js
import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3, Quaternion } from "three";
import { usePlotStore, useStarStore, useStore } from "../../store"; // Import useStore
import Star from "./Star";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";

const Stars = () => {
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const starSettings = useStarStore((s) => s.settings);

  // FIX: Subscribe to the global BSCStars flag
  const showStars = useStore((s) => s.BSCStars);

  const starGroupRef = useRef();

  const worldPosition = new Vector3();
  const worldQuaternion = new Quaternion();

  useEffect(() => {
    // Only update position if the group exists (which depends on showStars)
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      //We move the plot model to Epoch J2000 and copy Earths position and tilt
      movePlotModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
      //And then we set the starGroup to this so that RA and Dec will be correct
      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);
    }
  }, [plotObjects, showStars]); // Added showStars to dependency (optional but good practice)

  // FIX: If the toggle is off, don't render any stars from this group
  if (!showStars) return null;

  return (
    <group ref={starGroupRef}>
      {/* <axesHelper args={[10]} /> */}
      {starSettings.map((item, index) => (
        <Star key={index} sData={item} />
      ))}
    </group>
  );
};

export default Stars;
