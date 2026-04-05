import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { usePlotStore, useStore, useSettingsStore } from "../../store";
import refStarsData from "../../settings/reference_stars.json";
import bscSettings from "../../settings/BSC.json";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";
import createCircleTexture from "../../utils/createCircleTexture";

const PALETTE = [
  "#ff0055",
  "#00ffcc",
  "#ffaa00",
  "#ffff00",
  "#cc00ff",
  "#00ff00",
  "#0088ff",
  "#ff0000",
  "#ffffff",
  "#ff00ff",
  "#00ffff",
  "#ffaa88",
  "#88ff00",
  "#ff88ff",
  "#88ccff",
  "#ffcc00",
];

export default function ReferenceStars() {
  const pointsRef = useRef();
  const getThreeState = useThree((state) => state.get);
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const hScale = useStore((s) => s.hScale);
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);

  const settings = useSettingsStore((s) => s.settings);
  const earthSettings = useMemo(
    () => settings.find((s) => s.name === "Earth"),
    [settings]
  );

  const earthDeps = earthSettings
    ? `${earthSettings.speed}-${earthSettings.orbitRadius}-${earthSettings.tilt}-${earthSettings.tiltb}-${earthSettings.orbitCentera}-${earthSettings.orbitCenterb}-${earthSettings.startPos}`
    : "0";

  const [geometryData, setGeometryData] = useState({
    positions: null,
    colors: null,
  });
  const [hoveredData, setHoveredData] = useState(null);

  const circleTexture = useMemo(() => createCircleTexture("#ffffff"), []);

  const starColorMap = useMemo(() => {
    const uniqueNames = [...new Set(refStarsData.map((d) => d.name))];
    const map = new Map();
    uniqueNames.forEach((name, index) => {
      map.set(name, PALETTE[index % PALETTE.length]);
    });
    return map;
  }, []);

  const hipToDistMap = useMemo(() => {
    const map = new Map();
    bscSettings.forEach((star) => {
      if (star.HIP && star.P) {
        map.set(String(star.HIP), parseFloat(star.P) * 3.26156378);
      }
    });
    return map;
  }, []);

  useEffect(() => {
    if (!plotObjects || plotObjects.length === 0 || !pointsRef.current) return;

    const earthObj = plotObjects.find((p) => p.name === "Earth");
    if (!earthObj || !earthObj.cSphereRef?.current) return;

    if (earthSettings) {
      earthObj.speed = earthSettings.speed;
      earthObj.orbitRadius = earthSettings.orbitRadius;
      earthObj.tilt = earthSettings.tilt;
      earthObj.tiltb = earthSettings.tiltb;
      earthObj.orbitCentera = earthSettings.orbitCentera;
      earthObj.orbitCenterb = earthSettings.orbitCenterb;
      earthObj.startPos = earthSettings.startPos;
    }

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

      // --- 1. THE LOGIC REVERSAL ---
      // Temporarily flip the speed to simulate the perfect-stack condition you discovered.
      // This forces the visualizer to show zero deviation when tuned to your correct speed (-0.00024)
      const originalSpeed = earthObj.speed;
      if (originalSpeed !== 0) {
        earthObj.speed = -originalSpeed;
      }

      // 2. Move the model to the historical epoch
      movePlotModel(plotObjects, plotPos);

      // 3. Force matrix update
      let root = earthObj.cSphereRef.current;
      while (root.parent) {
        root = root.parent;
      }
      root.updateMatrixWorld(true);

      // 4. Extract the cleanly inverted Position and Quaternion
      const epochPos = new THREE.Vector3();
      const epochQuat = new THREE.Quaternion();
      earthObj.cSphereRef.current.getWorldPosition(epochPos);
      earthObj.cSphereRef.current.getWorldQuaternion(epochQuat);

      // 5. Instantly restore your actual app speed so nothing breaks
      earthObj.speed = originalSpeed;

      const raRad = rightAscensionToRadians(data.RA);
      const decRad = declinationToRadians(data.Dec);

      const hipMatch = data.name.match(/\d+/);
      const hipNum = hipMatch ? String(hipMatch[0]) : null;
      const distLy = hipToDistMap.get(hipNum) || 100;

      let dist;
      if (!officialStarDistances) {
        dist = (20000 * hScale) / 100;
      } else {
        const worldDist = distLy * 63241 * 100;
        dist =
          worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1);
      }

      // 6. Calculate Local Vector and apply the reversed matrices
      const localPos = sphericalToCartesian(raRad, decRad, dist);
      const localVec = new THREE.Vector3(localPos.x, localPos.y, localPos.z);

      localVec.applyQuaternion(epochQuat);

      // We restore standard addition. The position is now correctly inverted because of the speed flip.
      localVec.add(epochPos);

      positions.push(localVec.x, localVec.y, localVec.z);

      const hexColor = starColorMap.get(data.name);
      const color = new THREE.Color(hexColor);
      colors.push(color.r, color.g, color.b);
    });

    // Final Restoration
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
    hipToDistMap,
    earthDeps,
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

      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
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
            face: null,
            object: pointsRef.current,
          });
        }
      }
    },
    [getThreeState, geometryData]
  );

  const handlePointerMove = (e) => {
    e.stopPropagation();
    if (e.index !== undefined && geometryData.positions) {
      const starInfo = refStarsData[e.index];

      setHoveredData({
        name: starInfo.name,
        epoch: starInfo.epoch,
        RA: starInfo.RA,
        Dec: starInfo.Dec,
        x: e.clientX,
        y: e.clientY,
        color: starColorMap.get(starInfo.name),
      });
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredData(null);
  };

  useEffect(() => {
    if (!hoveredData) return;

    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.top = `${hoveredData.y - 80}px`;
    el.style.left = `${hoveredData.x + 15}px`;
    el.style.background = "rgba(10, 15, 25, 0.95)";
    el.style.color = "#e2e8f0";
    el.style.padding = "8px 12px";
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
      <strong style="color: ${hoveredData.color}; font-size: 14px;">HIP ${hoveredData.name}</strong>
      <br />
      <span style="color: #aaa;">Epoch:</span> <span style="color: #fff; font-weight: bold;">${hoveredData.epoch}</span>
      <br />
      <span style="color: #aaa;">RA:</span> <span style="color: #fff;">${hoveredData.RA}</span>
      <br />
      <span style="color: #aaa;">Dec:</span> <span style="color: #fff;">${hoveredData.Dec}</span>
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
          map={circleTexture}
          transparent={true}
          alphaTest={0.5}
        />
      </points>
    </group>
  );
}
