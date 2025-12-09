// BSCPicker.jsx
import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LABELED_STARS } from "./LabeledStars";
import { useStore, usePlotStore } from "../../store";
import bscSettings from "../../settings/BSC.json";

// Extracted helpers for re-use (to avoid re-creation)
const pixelBuffer = new Uint8Array(4);
const positionVector = new THREE.Vector3();
const worldPosition = new THREE.Vector3();

// Extracted texture helper (was lines 27-41 in original file)
function createCircleTexture() {
    // ... (Original circle texture creation logic) ...
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    context.fillStyle = "white";
    context.fill();
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}


const BSCPicker = ({ pickingPointsRef, starData, colorMap, onStarHover }) => {
  const { gl, camera, scene } = useThree();
  
  // Local Refs for performance optimization (no re-render when they change)
  const pickingRenderTarget = useRef();
  const pickingScene = useRef();
  const lastHoverTime = useRef(0);
  const currentHoverIndex = useRef(null);
  const debugPicking = useRef(false); // Debug toggle logic omitted for brevity
  
  // State from stores
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);
  const setLabeledStarPosition = useStore((s) => s.setLabeledStarPosition);
  const plotObjects = usePlotStore((s) => s.plotObjects); // Dependency for labeled stars
  
  // --- A. Hover Handler (Original lines 240-310) ---
  const handleHover = useCallback((event) => {
    if (!pickingPointsRef.current || !pickingRenderTarget.current) return;

    const now = performance.now();
    // 💡 OPTIMIZATION: Throttling (Original line 246)
    if (now - lastHoverTime.current < 300) return; 
    lastHoverTime.current = now;

    const { clientX, clientY } = event;
    const { width, height } = gl.domElement;
    const rect = gl.domElement.getBoundingClientRect();

    const x = Math.round((clientX - rect.left) * (width / rect.width));
    const y = Math.round((clientY - rect.top) * (height / rect.height));

    gl.setRenderTarget(pickingRenderTarget.current);
    gl.clear();
    gl.render(pickingScene.current, camera);
    gl.setRenderTarget(null);

    // Read pixel at cursor position
    gl.readRenderTargetPixels(
      pickingRenderTarget.current,
      x, height - y, 1, 1, pixelBuffer
    );

    const hexColor =
      (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
      
    // Use the colorMap passed from the data hook
    const starIndex = colorMap.get(hexColor);

    if (starIndex !== undefined) {
      if (currentHoverIndex.current !== starIndex) {
        currentHoverIndex.current = starIndex;
        // setHoveredPoint(starIndex); // State update moved to the parent wrapper if needed

        const star = starData[starIndex];
        const positions = pickingPointsRef.current.geometry.attributes.position.array;
        
        // Get the specific point's position
        positionVector.set(
            positions[starIndex * 3], 
            positions[starIndex * 3 + 1], 
            positions[starIndex * 3 + 2]
        );
        
        // Transform to world space
        pickingPointsRef.current.localToWorld(worldPosition.copy(positionVector));

        onStarHover({ star, position: worldPosition, index: starIndex }, event);
      }
    } else {
      if (currentHoverIndex.current !== null) {
        currentHoverIndex.current = null;
        // setHoveredPoint(null); // State update moved to the parent wrapper if needed
        if (onStarHover) {
          onStarHover(null);
        }
      }
    }
  }, [gl, camera, pickingPointsRef, starData, colorMap, onStarHover]); 
  // Dependency list is crucial for stability.

  // --- B. Setup Effects (Original lines 208-237) ---
  useEffect(() => {
    if (!gl || !camera) return;

    // Initialize picking scene and render target
    pickingRenderTarget.current = new THREE.WebGLRenderTarget(1, 1);
    pickingScene.current = new THREE.Scene();

    const updateRenderTarget = () => {
      const { width, height } = gl.domElement;
      pickingRenderTarget.current.setSize(width, height);
    };
    window.addEventListener("resize", updateRenderTarget);
    updateRenderTarget();

    const canvas = gl.domElement;
    canvas.addEventListener("mousemove", handleHover);

    return () => {
      window.removeEventListener("resize", updateRenderTarget);
      canvas.removeEventListener("mousemove", handleHover);
      if (pickingRenderTarget.current) {
        pickingRenderTarget.current.dispose();
      }
    };
  }, [gl, camera, handleHover]); 


  // --- C. Star Search Position Setter (Original lines 60-77) ---
  useEffect(() => {
    if (selectedStarHR && starData.length > 0 && pickingPointsRef.current) {
      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(selectedStarHR)
      );

      if (!star) {
        setSelectedStarPosition(null);
        return;
      }
      const starIndex = star.index;
      const positions = pickingPointsRef.current.geometry.attributes.position.array;
      const pos = positionVector.set(
          positions[starIndex * 3], 
          positions[starIndex * 3 + 1], 
          positions[starIndex * 3 + 2]
      );
      
      pickingPointsRef.current.localToWorld(pos);
      setSelectedStarPosition(pos);
    } else {
      setSelectedStarPosition(null);
    }
  }, [selectedStarHR, starData, pickingPointsRef, setSelectedStarPosition]);


  // --- D. Labeled Star Position Setter (Original lines 332-364) ---
  useEffect(() => {
    if (starData.length === 0 || !pickingPointsRef.current) return;
    
    // Logic to set Labeled Star positions (runs on change of starData or plotObjects)
    LABELED_STARS.forEach((query) => {
        // ... (Original search/position logic for labeled stars) ...
        const bscIndex = bscSettings.findIndex(
            (s) =>
                (s.N && s.N.toLowerCase() === query.toLowerCase()) ||
                s.HIP === query ||
                s.HR === query
        );

        if (bscIndex === -1) return;

        const bscStar = bscSettings[bscIndex];

        const star = starData.find(
            (s) => parseInt(s.HR) === parseInt(bscStar.HR)
        );
        if (!star) return;

        const starIndex = star.index;

        const positions = pickingPointsRef.current.geometry.attributes.position.array;
        const x = positions[starIndex * 3];
        const y = positions[starIndex * 3 + 1];
        const z = positions[starIndex * 3 + 2];

        const pos = new THREE.Vector3(x, y, z);
        pickingPointsRef.current.localToWorld(pos);

        let displayName =
            bscStar.N || (bscStar.HIP ? `HIP ${bscStar.HIP}` : `HR ${bscStar.HR}`);

        setLabeledStarPosition(bscStar.HR, pos, displayName);
    });
  }, [starData, setLabeledStarPosition, plotObjects, pickingPointsRef]);
  
  // E. Add Picking Points to Scene (Original lines 322-329)
  useEffect(() => {
    if (pickingPointsRef.current && pickingScene.current) {
      pickingScene.current.add(pickingPointsRef.current);
      return () => {
        if (pickingScene.current && pickingPointsRef.current) {
          pickingScene.current.remove(pickingPointsRef.current);
        }
      };
    }
  }, [pickingPointsRef.current]);

  return null; // Side-effect component
};

export default BSCPicker;