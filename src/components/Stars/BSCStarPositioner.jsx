// BSCStarPositioner.jsx
import { useEffect } from "react";
import { usePlotStore } from "../../store";
import * as THREE from "three";
import { dateTimeToPos } from "../../utils/time-date-functions";

// Extracted moveModel helper (from lines 19-24 of original file)
function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    // Crucial: check for current ref before accessing
    if (pObj.orbitRef && pObj.orbitRef.current) {
        pObj.orbitRef.current.rotation.y =
          pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
    }
  });
}

const worldPosition = new THREE.Vector3();
const worldQuaternion = new THREE.Quaternion();

const BSCStarPositioner = ({ starGroupRef, pickingPointsRef }) => {
  const plotObjects = usePlotStore((s) => s.plotObjects);

  // Original useEffect logic from lines 312-330
  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      
      // 1. Move model to J2000
      moveModel(plotObjects, epochJ2000Pos);
      
      // 2. Find Earth and get transform
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      
      if (earthObj && earthObj.cSphereRef && earthObj.cSphereRef.current) {
          earthObj.cSphereRef.current.getWorldPosition(worldPosition);
          earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
          
          // 3. Set the visible group's transform
          starGroupRef.current.position.copy(worldPosition);
          starGroupRef.current.quaternion.copy(worldQuaternion);
          
          // 4. Set the picking group's transform
          if (pickingPointsRef.current) {
            pickingPointsRef.current.position.copy(worldPosition);
            pickingPointsRef.current.quaternion.copy(worldQuaternion);
          }
      }
    }
  }, [plotObjects, starGroupRef, pickingPointsRef]); 
  
  return null; // Side-effect component
};

export default BSCStarPositioner;