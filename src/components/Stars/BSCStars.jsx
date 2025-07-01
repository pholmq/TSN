import React, { useRef, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3, Quaternion } from "three";
import { usePlotStore } from "../../store";
import { useBSCStore } from "./BSCStore";

import BSCStar from "./BSCStar";
import { dateTimeToPos } from "../../utils/time-date-functions";

function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}

const BSCStars = () => {
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const { settings: bscSettings, getSetting } = useBSCStore();

  const starGroupRef = useRef();
  const { scene } = useThree();

  const worldPosition = new Vector3();
  const worldQuaternion = new Quaternion();

  // Memoize starsArray to compute only once unless bscSettings changes
  const starsArray = useMemo(() => {
    // console.log("Computing starsArray");
    return Array.from(bscSettings.values());
  }, [bscSettings]);

  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      // Move the plot model to Epoch J2000 and copy Earth's position and tilt
      moveModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
      // Set the starGroup to this so that RA and Dec will be correct
      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);
    }
  }, [plotObjects]); // Keep dependency for now; see notes for optimization

  return (
    <group ref={starGroupRef}>
      {/* <axesHelper args={[10]} /> */}
      {starsArray.map((starData, index) => (
        <BSCStar
          key={index}
          starData={starData}
        />
      ))}
    </group>
  );
};

export default React.memo(BSCStars);
