// src/components/Stars/BSCStars.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Vector3, Quaternion } from "three";
import { usePlotStore, useStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";
import { pointShaderMaterial } from "./starShaders";
import { LABELED_STARS } from "./LabeledStars";
import { useBSCStarData } from "./useBSCStarData";
import Star from "./Star";

// Cache vectors outside the component to prevent garbage collection stutters
const _v1 = new THREE.Vector3();
const _worldPos = new THREE.Vector3();

const BSCStars = ({ onStarClick, onStarHover }) => {
  const pointsRef = useRef();
  const starGroupRef = useRef();
  const targetGroupRef = useRef(null);
  const hiddenStarIndexRef = useRef(null);
  const hiddenStarSizeRef = useRef(null);

  const [targetedStarData, setTargetedStarData] = useState(null);

  // Access imperative R3F state to get real-time mouse/camera without re-renders
  const getThreeState = useThree((state) => state.get);

  const plotObjects = usePlotStore((s) => s.plotObjects);
  const currentHoverIndex = useRef(null);
  const currentHoverDataRef = useRef(null);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);
  const setLabeledStarPosition = useStore((s) => s.setLabeledStarPosition);
  const cameraTarget = useStore((s) => s.cameraTarget);

  const { positions, colors, starData, sizes } = useBSCStarData();

  // Handle Target/Focus Reset
  useEffect(() => {
    if (!cameraTarget || !cameraTarget.startsWith("BSCStarTarget")) {
      setTargetedStarData(null);
      if (hiddenStarIndexRef.current !== null && pointsRef.current) {
        const oldIndex = hiddenStarIndexRef.current;
        pointsRef.current.geometry.attributes.size.array[oldIndex] =
          hiddenStarSizeRef.current;
        pointsRef.current.geometry.attributes.size.needsUpdate = true;
        hiddenStarIndexRef.current = null;
      }
    }
  }, [cameraTarget, sizes]);

  // Handle Search Selection
  useEffect(() => {
    if (selectedStarHR) {
      const isSpecial = specialStarsData.some(
        (s) =>
          (s.HR && String(s.HR) === selectedStarHR) ||
          selectedStarHR.startsWith("Special:")
      );
      if (isSpecial) return;
    }

    if (selectedStarHR && starData.length > 0 && pointsRef.current) {
      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(selectedStarHR)
      );
      if (!star) {
        if (!selectedStarHR.includes(":")) setSelectedStarPosition(null);
        return;
      }
      const starIndex = star.index;
      const posArray = pointsRef.current.geometry.attributes.position.array;
      const pos = new THREE.Vector3(
        posArray[starIndex * 3],
        posArray[starIndex * 3 + 1],
        posArray[starIndex * 3 + 2]
      );
      pointsRef.current.localToWorld(pos);
      setSelectedStarPosition(pos);
    } else if (!selectedStarHR) {
      setSelectedStarPosition(null);
    }
  }, [selectedStarHR, starData, setSelectedStarPosition]);

  // Sync Attributes to Geometry
  useEffect(() => {
    if (pointsRef.current) {
      const geo = pointsRef.current.geometry;
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }
  }, [positions, colors, sizes]);

  // Apply Geocentric rotations
  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      const worldPosition = new Vector3();
      const worldQuaternion = new Quaternion();
      movePlotModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);

      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);
    }
  }, [plotObjects]);

  // Update Labeled Stars
  useEffect(() => {
    if (starData.length === 0 || !pointsRef.current) return;
    LABELED_STARS.forEach((query) => {
      const bscStar = bscSettings.find(
        (s) =>
          s.N?.toLowerCase() === query.toLowerCase() ||
          s.HIP === query ||
          s.HR === query
      );
      if (!bscStar) return;

      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(bscStar.HR)
      );
      if (!star) return;

      const posArray = pointsRef.current.geometry.attributes.position.array;
      const pos = new THREE.Vector3(
        posArray[star.index * 3],
        posArray[star.index * 3 + 1],
        posArray[star.index * 3 + 2]
      );
      pointsRef.current.localToWorld(pos);
      setLabeledStarPosition(
        bscStar.HR,
        pos,
        bscStar.N || (bscStar.HIP ? `HIP ${bscStar.HIP}` : `HR ${bscStar.HR}`)
      );
    });
  }, [starData, setLabeledStarPosition, plotObjects]);

  // 💥 THE FIX: Screen-Space Raycaster Override
  const customRaycast = useCallback(
    (raycaster, intersects) => {
      if (!pointsRef.current || useStore.getState().runIntro) return;

      const { camera, size, pointer } = getThreeState();
      const geometry = pointsRef.current.geometry;
      const posArray = geometry.attributes.position.array;
      const matrixWorld = pointsRef.current.matrixWorld;

      // Define hover radius in CSS screen pixels (Adjust this up or down for feel)
      const HOVER_RADIUS_PX = 4;
      const thresholdSqPx = HOVER_RADIUS_PX * HOVER_RADIUS_PX;

      // Map R3F NDC pointer to physical screen pixels
      const pointerPxX = ((pointer.x + 1) / 2) * size.width;
      const pointerPxY = ((-pointer.y + 1) / 2) * size.height;

      for (let i = 0; i < posArray.length / 3; i++) {
        _v1.set(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
        _v1.applyMatrix4(matrixWorld);

        // Save the true 3D world position before modifying the vector
        _worldPos.copy(_v1);

        // Project the 3D star to 2D screen space
        _v1.project(camera);

        // Skip if the star is behind the camera or totally off screen
        if (_v1.z > 1 || _v1.z < -1) continue;
        if (_v1.x < -1.2 || _v1.x > 1.2 || _v1.y < -1.2 || _v1.y > 1.2)
          continue;

        // Convert star to physical screen pixels
        const starPxX = ((_v1.x + 1) / 2) * size.width;
        const starPxY = ((-_v1.y + 1) / 2) * size.height;

        // Calculate 2D pixel distance to the mouse
        const distSq =
          (starPxX - pointerPxX) ** 2 + (starPxY - pointerPxY) ** 2;

        // If the mouse is within our exact pixel radius, it's a hit!
        if (distSq < thresholdSqPx) {
          const distance3D = raycaster.ray.origin.distanceTo(_worldPos);

          intersects.push({
            distance: distance3D, // True 3D distance ensures R3F sorts overlapping objects correctly
            distanceToRay: Math.sqrt(distSq),
            point: _worldPos.clone(),
            index: i,
            face: null,
            object: pointsRef.current,
          });
        }
      }
    },
    [getThreeState]
  );

  // --- NATIVE R3F POINTER EVENTS ---

  const handlePointerMove = (e) => {
    e.stopPropagation();

    const starIndex = e.index;

    if (starIndex !== undefined && currentHoverIndex.current !== starIndex) {
      currentHoverIndex.current = starIndex;
      const star = starData[starIndex];

      const worldPosition = new THREE.Vector3(
        positions[starIndex * 3],
        positions[starIndex * 3 + 1],
        positions[starIndex * 3 + 2]
      );
      if (pointsRef.current) pointsRef.current.localToWorld(worldPosition);

      const hoverData = { star, position: worldPosition, index: starIndex };
      currentHoverDataRef.current = hoverData;

      if (onStarHover) onStarHover(hoverData, e);
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    currentHoverIndex.current = null;
    currentHoverDataRef.current = null;
    if (onStarHover) onStarHover(null);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (useStore.getState().runIntro) return;
    if (currentHoverDataRef.current && onStarClick) {
      onStarClick(currentHoverDataRef.current, e);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (useStore.getState().runIntro) return;
    // --- Planet Camera Intercept ---
    if (useStore.getState().planetCamera) {
      if (currentHoverDataRef.current) {
        useStore
          .getState()
          .setSearchTarget(String(currentHoverDataRef.current.star.HR));
      }
      return; // Exit early to prevent Orbit target cloning
    }

    if (currentHoverDataRef.current && targetGroupRef.current) {
      const { index, star } = currentHoverDataRef.current;

      if (hiddenStarIndexRef.current !== null && pointsRef.current) {
        const oldIndex = hiddenStarIndexRef.current;
        pointsRef.current.geometry.attributes.size.array[oldIndex] =
          hiddenStarSizeRef.current;
        pointsRef.current.geometry.attributes.size.needsUpdate = true;
      }

      hiddenStarIndexRef.current = index;
      if (pointsRef.current) {
        // FIX: Save the true size before shrinking it
        hiddenStarSizeRef.current =
          pointsRef.current.geometry.attributes.size.array[index];
        pointsRef.current.geometry.attributes.size.array[index] = 0;
        pointsRef.current.geometry.attributes.size.needsUpdate = true;
      }

      targetGroupRef.current.position.set(
        positions[index * 3],
        positions[index * 3 + 1],
        positions[index * 3 + 2]
      );

      const r = colors[index * 3];
      const g = colors[index * 3 + 1];
      const b = colors[index * 3 + 2];
      const hexColor = "#" + new THREE.Color(r, g, b).getHexString();

      const targetName = `BSCStarTarget_${star.HR}`;
      targetGroupRef.current.name = targetName;

      setTargetedStarData({
        ...star,
        isTargetClone: true,
        visible: true,
        magnitude: star.mag ?? star.magnitude ?? star.Mag ?? 3,
        overrideColor: hexColor,
      });

      if (onStarHover) onStarHover(null);
      currentHoverIndex.current = null;
      currentHoverDataRef.current = null;
      useStore.getState().setCameraTarget(targetName);
    }
  };

  return (
    <group ref={starGroupRef}>
      <group
        ref={targetGroupRef}
        name={
          targetedStarData
            ? `BSCStarTarget_${targetedStarData.HR}`
            : "BSCStarTarget"
        }
      >
        {targetedStarData && <Star sData={targetedStarData} />}
      </group>

      {/* Attach the custom raycaster directly to the mesh */}
      <points
        ref={pointsRef}
        raycast={customRaycast}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <bufferGeometry />
        <shaderMaterial attach="material" args={[pointShaderMaterial]} />
      </points>
    </group>
  );
};

export default BSCStars;
