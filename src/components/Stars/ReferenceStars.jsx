import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { usePlotStore, useStore } from "../../store";
import refStarsData from "../../settings/reference_stars.json";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";

// Distinct colors for the 4 reference stars
const STAR_COLORS = {
  "alf UMi": "#ff0055", // Polaris (Red/Pink)
  "alf CMa": "#00ffcc", // Sirius (Cyan)
  "alf Lyr": "#ffaa00", // Vega (Orange)
  "del Ori": "#ffff00", // Mintaka (Yellow)
};

const FALLBACK_COLORS = ["#ff00ff", "#00ffff", "#ffffff", "#00ff00"];

export default function ReferenceStars() {
  const pointsRef = useRef();
  const plotObjects = usePlotStore((s) => s.plotObjects);

  // Validated from src/store.js
  const hScale = useStore((s) => s.hScale);
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);

  const [geometryData, setGeometryData] = useState({
    positions: null,
    colors: null,
  });

  useEffect(() => {
    if (!plotObjects || plotObjects.length === 0 || !pointsRef.current) return;

    const earthObj = plotObjects.find((p) => p.name === "Earth");
    if (!earthObj || !earthObj.cSphereRef?.current) return;

    // 1. Cache the live rotation of every plot object before altering the timeline
    // (This avoids parsing date/time strings entirely)
    const originalRotations = new Map();
    plotObjects.forEach((pObj) => {
      if (pObj.orbitRef && pObj.orbitRef.current) {
        originalRotations.set(pObj.name, pObj.orbitRef.current.rotation.y);
      }
    });

    const positions = [];
    const colors = [];
    const uniqueNames = [...new Set(refStarsData.map((d) => d.name))];

    refStarsData.forEach((data) => {
      // --- A. Move Simulation to the Star's Historical Epoch ---
      const year = Math.floor(data.epoch);
      const dateStr = `${year}-01-01`;
      const plotPos = dateTimeToPos(dateStr, "12:00:00");

      // Validated from src/utils/plotModelFunctions.js
      movePlotModel(plotObjects, plotPos);
      earthObj.cSphereRef.current.updateMatrixWorld(true);

      // --- B. Calculate Local Coordinates ---
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

      // --- C. Transform to World Space ---
      localVec.applyMatrix4(earthObj.cSphereRef.current.matrixWorld);

      positions.push(localVec.x, localVec.y, localVec.z);

      // --- D. Assign Colors ---
      const hexColor =
        STAR_COLORS[data.name] ||
        FALLBACK_COLORS[
          uniqueNames.indexOf(data.name) % FALLBACK_COLORS.length
        ];
      const color = new THREE.Color(hexColor);
      colors.push(color.r, color.g, color.b);
    });

    // 2. Safely restore the exact scene state back to the present moment
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
  }, [plotObjects, hScale, starDistanceModifier, officialStarDistances]);

  // Apply geometry
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

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={8}
        vertexColors
        sizeAttenuation={false}
        depthTest={true}
      />
    </points>
  );
}
