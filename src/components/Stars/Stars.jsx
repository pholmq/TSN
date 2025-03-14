// Stars.js
import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Vector3, Quaternion } from "three";
import { usePlotStore, useStarStore } from "../../store";
import Star from "./Star";
import { dateTimeToPos } from "../../utils/time-date-functions";

function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}
const Stars = () => {
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const starSettings = useStarStore((s) => s.settings);


  const starGroupRef = useRef();
  const { scene } = useThree();

  const worldPosition = new Vector3();
  const worldQuaternion = new Quaternion();

  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      //We move the plot model to Epoch J2000 and copy Earths position and tilt
      moveModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
      //And then we set the starGroup to this so that RA and Dec will be correct
      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);

    } 
  }, [plotObjects]);
  
  return (
    <group ref={starGroupRef}>
       {/* <axesHelper args={[10]} /> */}
      {/* <Star name="Polaris" />
      <Star name="Reference Star South" />
      <Star name="Reference Star RA 0" />
      <Star name="Reference Star RA 12" />
      <Star name="Sirius" /> */}
      {starSettings.map((item, index) => (
        <Star key={index} name={item.name} />
      ))}
    </group>
  );
};

export default Stars;
