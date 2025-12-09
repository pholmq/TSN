// BSCStars.jsx (Modified)
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { usePlotStore, useStore } from "../../store";
import { pointShaderMaterial, pickingShaderMaterial } from "./starShaders";

// Import the new components and hooks
import { useBSCStarData } from "./useBSCStarData";
import BSCPicker from "./BSCPicker";
import BSCStarPositioner from "./BSCStarPositioner";

const BSCStars = ({ onStarClick, onStarHover }) => {
  // --- 1. Refs & Data ---
  const pointsRef = useRef(); // Visible stars
  const starGroupRef = useRef(); // Group for alignment
  const pickingPointsRef = useRef(); // Invisible picking mesh

  // The state of the currently hovered point must be managed here 
  // to potentially affect the visible rendering logic (e.g., highlighting)
  const [hoveredPoint, setHoveredPoint] = useState(null); 

  // Call the new data hook
  const { positions, colors, sizes, pickingSizes, starData, pickingColors, colorMap } =
    useBSCStarData();

  // --- 2. Buffer Attribute Update Effect (Original lines 304-311) ---
  // This must run whenever the position/size/color arrays change (i.e., when useBSCStarData recalculates)
  useEffect(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      
      // Mandatory updates
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }

    if (pickingPointsRef.current) {
      const geometry = pickingPointsRef.current.geometry;
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(pickingColors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(pickingSizes, 1));
      
      // Mandatory updates
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }
  }, [positions, colors, pickingColors, sizes, pickingSizes]);


  // --- 3. Render ---
  return (
    <>
      {/* The BSCPicker component handles all GPU-based interaction logic 
        and updates the global state for search position/labeled stars.
      */}
      <BSCPicker 
        pickingPointsRef={pickingPointsRef} 
        starData={starData} 
        colorMap={colorMap}
        onStarHover={onStarHover}
      />
      
      {/* The BSCStarPositioner handles the J2000 position alignment logic, 
        running its useEffect when plotObjects or its refs change.
      */}
      <BSCStarPositioner 
        starGroupRef={starGroupRef} 
        pickingPointsRef={pickingPointsRef} 
      />

      {/* Group for alignment and visible stars */}
      <group ref={starGroupRef}>
        {/* Visible stars */}
        <points ref={pointsRef}>
          <bufferGeometry>
            {/* The attributes are initialized empty here, but updated in the useEffect above */}
            <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
            <bufferAttribute attach="attributes-color" array={colors} count={colors.length / 3} itemSize={3} />
            <bufferAttribute attach="attributes-size" array={sizes} count={sizes.length} itemSize={1} />
          </bufferGeometry>
          <shaderMaterial attach="material" args={[pointShaderMaterial]} />
        </points>
      </group>

      {/* Picking stars (invisible to user, rendered to FBO) */}
      <points ref={pickingPointsRef}>
        <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
            <bufferAttribute attach="attributes-color" array={pickingColors} count={pickingColors.length / 3} itemSize={3} />
            <bufferAttribute attach="attributes-size" array={pickingSizes} count={pickingSizes.length} itemSize={1} />
        </bufferGeometry>
        {/* Crucial: Must use the picking shader */}
        <shaderMaterial attach="material" args={[pickingShaderMaterial]} />
      </points>
    </>
  );
};

export default BSCStars;