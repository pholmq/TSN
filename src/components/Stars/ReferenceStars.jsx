import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { usePlotStore, useStore } from "../../store";
import refStarsData from "../../settings/reference_stars.json";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";

// High-contrast color palette for dynamic star assignment
const PALETTE = [
  "#ff0055", // Neon Pink
  "#00ffcc", // Cyan
  "#ffaa00", // Orange
  "#ffff00", // Yellow
  "#cc00ff", // Purple
  "#00ff00", // Lime Green
  "#0088ff", // Bright Blue
  "#ff0000", // Red
  "#ffffff", // White
];

export default function ReferenceStars() {
  const pointsRef = useRef();
  const getThreeState = useThree((state) => state.get);
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const hScale = useStore((s) => s.hScale);
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);

  const [geometryData, setGeometryData] = useState({
    positions: null,
    colors: null,
  });
  const [hoveredData, setHoveredData] = useState(null);

  // Dynamically map unique stars in the JSON to colors from the PALETTE
  const starColorMap = useMemo(() => {
    const uniqueNames = [...new Set(refStarsData.map((d) => d.name))];
    const map = new Map();
    uniqueNames.forEach((name, index) => {
      map.set(name, PALETTE[index % PALETTE.length]);
    });
    return map;
  }, []);

  useEffect(() => {
    if (!plotObjects || plotObjects.length === 0 || !pointsRef.current) return;

    const earthObj = plotObjects.find((p) => p.name === "Earth");
    if (!earthObj || !earthObj.cSphereRef?.current) return;

    const originalRotations = new Map();
    plotObjects.forEach((pObj) => {
      if (pObj.orbitRef && pObj.orbitRef.current) {
        originalRotations.set(pObj.name, pObj.orbitRef.current.rotation.y);
      }
    });

    const positions = [];
    const colors = [];

    refStarsData.forEach((data) => {
      const year = Math.floor(data.epoch);
      const plotPos = dateTimeToPos(`${year}-01-01`, "12:00:00");

      movePlotModel(plotObjects, plotPos);
      earthObj.cSphereRef.current.updateMatrixWorld(true);

      const raRad = rightAscensionToRadians(data.RA);
      const decRad = declinationToRadians(data.Dec);
      const distLy = parseFloat(data.P) * 3.26156378;

      let dist;
      if (!officialStarDistances) {
        dist = (20000 * hScale) / 100;
      } else {
        const worldDist = distLy * 63241 * 100;
        dist =
          worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1);
      }

      const localPos = sphericalToCartesian(raRad, decRad, dist);
      const localVec = new THREE.Vector3(localPos.x, localPos.y, localPos.z);
      localVec.applyMatrix4(earthObj.cSphereRef.current.matrixWorld);

      positions.push(localVec.x, localVec.y, localVec.z);

      // Get dynamically assigned color
      const hexColor = starColorMap.get(data.name);
      const color = new THREE.Color(hexColor);
      colors.push(color.r, color.g, color.b);
    });

    plotObjects.forEach((pObj) => {
      if (
        pObj.orbitRef &&
        pObj.orbitRef.current &&
        originalRotations.has(pObj.name)
      ) {
        pObj.orbitRef.current.rotation.y = originalRotations.get(pObj.name);
        pObj.orbitRef.current.updateMatrixWorld(true);
      }
    });

    setGeometryData({
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    });
  }, [
    plotObjects,
    hScale,
    starDistanceModifier,
    officialStarDistances,
    starColorMap,
  ]);

  useEffect(() => {
    if (pointsRef.current && geometryData.positions) {
      const geo = pointsRef.current.geometry;
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(geometryData.positions, 3)
      );
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(geometryData.colors, 3)
      );
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }
  }, [geometryData]);

  const customRaycast = useCallback(
    (raycaster, intersects) => {
      if (!pointsRef.current || !geometryData.positions) return;

      const { camera, size, pointer } = getThreeState();
      const posArray = geometryData.positions;
      const matrixWorld = pointsRef.current.matrixWorld;

      const HOVER_RADIUS_PX = 8;
      const thresholdSqPx = HOVER_RADIUS_PX * HOVER_RADIUS_PX;

      const pointerPxX = ((pointer.x + 1) / 2) * size.width;
      const pointerPxY = ((-pointer.y + 1) / 2) * size.height;

      const _v1 = new THREE.Vector3();
      const _worldPos = new THREE.Vector3();

      for (let i = 0; i < posArray.length / 3; i++) {
        _v1.set(posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2]);
        _v1.applyMatrix4(matrixWorld);
        _worldPos.copy(_v1);
        _v1.project(camera);

        if (_v1.z > 1 || _v1.z < -1) continue;

        const starPxX = ((_v1.x + 1) / 2) * size.width;
        const starPxY = ((-_v1.y + 1) / 2) * size.height;

        const distSq =
          (starPxX - pointerPxX) ** 2 + (starPxY - pointerPxY) ** 2;

        if (distSq < thresholdSqPx) {
          intersects.push({
            distance: raycaster.ray.origin.distanceTo(_worldPos),
            distanceToRay: Math.sqrt(distSq),
            point: _worldPos.clone(),
            index: i,
            object: pointsRef.current,
          });
        }
      }
    },
    [getThreeState, geometryData]
  );

  // --- HOVER TRACKING ---
  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (e.index !== undefined && geometryData.positions) {
      const starInfo = refStarsData[e.index];

      setHoveredData({
        name: starInfo.name,
        epoch: starInfo.epoch,
        x: e.clientX,
        y: e.clientY,
        color: starColorMap.get(starInfo.name), // Use dynamic map
      });
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredData(null);
  };

  // --- RAW DOM TOOLTIP GENERATION ---
  useEffect(() => {
    if (!hoveredData) return;

    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.top = `${hoveredData.y - 50}px`;
    el.style.left = `${hoveredData.x + 15}px`;
    el.style.background = "rgba(10, 15, 25, 0.95)";
    el.style.color = "#e2e8f0";
    el.style.padding = "6px 10px";
    el.style.borderRadius = "4px";
    el.style.border = `1px solid ${hoveredData.color}`;
    el.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.6)";
    el.style.fontSize = "12px";
    el.style.whiteSpace = "nowrap";
    el.style.fontFamily = "monospace";
    el.style.pointerEvents = "none";
    el.style.userSelect = "none";
    el.style.zIndex = "2147483647";

    el.innerHTML = `
      <strong style="color: ${hoveredData.color}; font-size: 13px;">${hoveredData.name}</strong>
      <br />
      <span style="font-size: 11px; opacity: 0.8;">Epoch: </span>
      <span style="color: #fff; font-weight: bold; font-size: 12px;">${hoveredData.epoch}</span>
    `;

    document.body.appendChild(el);

    return () => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    };
  }, [hoveredData]);

  return (
    <group>
      <points
        ref={pointsRef}
        raycast={customRaycast}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <bufferGeometry />
        <pointsMaterial
          size={12}
          vertexColors
          sizeAttenuation={false}
          depthTest={true}
        />
      </points>
    </group>
  );
}
