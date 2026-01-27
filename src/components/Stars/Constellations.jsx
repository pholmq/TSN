import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import constellationsData from "../../settings/constellations.json"; // Adjust path if necessary
import bscSettings from "../../settings/BSC.json"; // Need this to map HIP to positions
import { useBSCStarData } from "./useBSCStarData";
import { useStore, usePlotStore } from "../../store";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";

const Constellations = () => {
  // 1. Get current star positions from the hook (reactive to store settings)
  const { positions } = useBSCStarData();
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const showConstellations = useStore((s) => s.showConstellations);
  const groupRef = useRef();

  // 2. Create a lookup map: HIP Number -> Index in the positions array
  // We utilize bscSettings (BSC.json) because useBSCStarData returns positions 
  // in the same order as BSC.json.
  const hipToIndexMap = useMemo(() => {
    const map = new Map();
    bscSettings.forEach((star, index) => {
      if (star.HIP) {
        // Parse int to ensure we match the format in constellations.json
        map.set(parseInt(star.HIP), index);
      }
    });
    return map;
  }, []);

  // 3. Generate the Geometry for the Constellation lines
  const geometry = useMemo(() => {
    const points = [];
    const constellations = constellationsData.constellations || [];
    const missingHips = new Set(); // To prevent duplicate logs for the same star

    // Filter out invalid constellations or those without lines
    const validConstellations = constellations.filter(
      (c) => c.lines && c.lines.length > 0
    );

    validConstellations.forEach((constellation) => {
      constellation.lines.forEach((lineSeq) => {
        // lineSeq is an array of HIP numbers connected in sequence
        for (let i = 0; i < lineSeq.length - 1; i++) {
          const hip1 = lineSeq[i];
          const hip2 = lineSeq[i + 1];

          const idx1 = hipToIndexMap.get(hip1);
          const idx2 = hipToIndexMap.get(hip2);

          // LOGGING LOGIC: Check for missing stars
          if (idx1 === undefined && !missingHips.has(hip1)) {
            console.warn(`Constellation "${constellation.common_name?.english || constellation.id}": HIP ${hip1} not found in BSC data.`);
            missingHips.add(hip1);
          }
          if (idx2 === undefined && !missingHips.has(hip2)) {
            console.warn(`Constellation "${constellation.common_name?.english || constellation.id}": HIP ${hip2} not found in BSC data.`);
            missingHips.add(hip2);
          }

          // Only draw line if both stars exist in our dataset
          if (idx1 !== undefined && idx2 !== undefined) {
            // Retrieve x,y,z from the flat positions array (stride of 3)
            const p1 = new THREE.Vector3(
              positions[idx1 * 3],
              positions[idx1 * 3 + 1],
              positions[idx1 * 3 + 2]
            );
            const p2 = new THREE.Vector3(
              positions[idx2 * 3],
              positions[idx2 * 3 + 1],
              positions[idx2 * 3 + 2]
            );
            points.push(p1, p2);
          }
        }
      });
    });

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [positions, hipToIndexMap]);

  // 4. Alignment Logic (Must match Stars.jsx to ensure overlay is correct)
  // This positions the group at Earth's location and aligns it with J2000 orientation
  useEffect(() => {
    if (plotObjects.length > 0 && groupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      
      // Temporarily move plot model to J2000 to grab the correct reference frame
      // This mimics the logic in Stars.jsx
      movePlotModel(plotObjects, epochJ2000Pos);
      
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      
      if (earthObj && earthObj.cSphereRef.current) {
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        
        earthObj.cSphereRef.current.getWorldPosition(worldPosition);
        earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
        
        groupRef.current.position.copy(worldPosition);
        groupRef.current.quaternion.copy(worldQuaternion);
      }
    }
  }, [plotObjects]);

  return (
    <group ref={groupRef} visible={showConstellations}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color={0xffffff}
          opacity={0.3}
          transparent={true}
          depthWrite={false} // Prevents lines from obscuring distant stars or creating Z-fighting
        />
      </lineSegments>
    </group>
  );
};

export default Constellations;