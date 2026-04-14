// src/components/EphemerisChecker/CheckerController.jsx
import * as THREE from "three";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePlotStore, useSettingsStore } from "../../store";
import {
  useCheckerStore,
  raToDeg,
  decToDeg,
  parseDistanceToAU,
} from "./checkerStore";
import { dateTimeToPos } from "../../utils/time-date-functions";
import {
  movePlotModel,
  getPlotModelRaDecDistance,
} from "../../utils/plotModelFunctions";
import { sphericalToCartesian } from "../../utils/celestial-functions";
import createCircleTexture from "../../utils/createCircleTexture";

// MODULE-LEVEL CACHE: Survives React Suspense unmounts/remounts.
let cachedSettingsHash = null;
let cachedParsedData = null;

const CheckerController = () => {
  const pointsRef = useRef();
  const modelPointsRef = useRef();
  const getThreeState = useThree((state) => state.get);
  const { invalidate, scene } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const settings = useSettingsStore((s) => s.settings);

  // Map only the exact physical parameters that dictate orbital math
  const physicalSettingsHash = useMemo(() => {
    return settings
      .map(
        (s) =>
          `${s.name}|${s.startPos}|${s.speed}|${s.orbitRadius}|${s.orbitCentera}|${s.orbitCenterb}|${s.orbitCenterc}|${s.orbitTilta}|${s.orbitTiltb}|${s.tilt}|${s.tiltb}|${s.rotationStart}|${s.rotationSpeed}`
      )
      .join("||");
  }, [settings]);

  const {
    showChecker,
    parsedData,
    triggerCheck,
    setTriggerCheck,
    setIsChecking,
    setProgress,
    setResults,
    visualPoints,
    setVisualPoints,
    modelPoints,
    setModelPoints,
    showPlot,
    plotSize,
    checkPlotOpacity,
  } = useCheckerStore();

  const [checking, setChecking] = useState(false);
  const [hoveredData, setHoveredData] = useState(null);

  const circleTexture = useMemo(() => createCircleTexture("#ffffff"), []);

  const jobRef = useRef({
    planets: [],
    currentPlanetIdx: 0,
    currentRowIdx: 0,
    deviations: {},
    totalRows: 0,
    processedRows: 0,
    rawPoints: [],
    rawModelPoints: [],
  });

  useEffect(() => {
    // 1. If checker is closed, clear everything including the module cache
    if (!showChecker) {
      setChecking(false);
      setIsChecking(false);
      cachedSettingsHash = null;
      cachedParsedData = null;
      return;
    }

    if (parsedData) {
      // 2. Prevent phantom checks from Suspense remounts
      if (
        cachedSettingsHash === physicalSettingsHash &&
        cachedParsedData === parsedData
      ) {
        return; // The math and data haven't changed. Do nothing.
      }

      // 3. Update the cache to the new state
      cachedSettingsHash = physicalSettingsHash;
      cachedParsedData = parsedData;

      setChecking(false);
      setIsChecking(false);
      const timer = setTimeout(() => setTriggerCheck(true), 300);
      return () => clearTimeout(timer);
    }
  }, [
    physicalSettingsHash,
    parsedData,
    setTriggerCheck,
    setIsChecking,
    showChecker,
  ]);

  useEffect(() => {
    if (triggerCheck && parsedData && showChecker) {
      setIsChecking(true);
      setProgress(0);
      setVisualPoints(null);
      setModelPoints(null);

      const planets = Object.keys(parsedData);
      let totalRows = 0;
      const initialDeviations = {};

      planets.forEach((p) => {
        totalRows += parsedData[p].length;
        initialDeviations[p] = {
          maxErrors: {
            maxRaDev: 0,
            maxDecDev: 0,
            maxDistDev: 0,
            maxElongDev: 0,
          },
          rows: [],
        };
      });

      jobRef.current = {
        planets,
        currentPlanetIdx: 0,
        currentRowIdx: 0,
        deviations: initialDeviations,
        totalRows,
        processedRows: 0,
        rawPoints: [],
        rawModelPoints: [],
      };

      setChecking(true);
      setTriggerCheck(false);
    }
  }, [
    triggerCheck,
    parsedData,
    setIsChecking,
    setProgress,
    setTriggerCheck,
    showChecker,
    setVisualPoints,
    setModelPoints,
  ]);

  useFrame(() => {
    if (!checking || !parsedData || !showChecker) return;
    invalidate();

    const job = jobRef.current;
    const BATCH_SIZE = 50;
    let batchCount = 0;

    while (
      batchCount < BATCH_SIZE &&
      job.currentPlanetIdx < job.planets.length
    ) {
      const planetName = job.planets[job.currentPlanetIdx];
      const rows = parsedData[planetName];

      if (job.currentRowIdx < rows.length) {
        const row = rows[job.currentRowIdx];
        const pos = dateTimeToPos(row.date, row.time);

        movePlotModel(plotObjects, pos);
        const data = getPlotModelRaDecDistance(planetName, plotObjects, scene);
        if (!data) return;

        const modelRaDeg = raToDeg(data.ra);
        const modelDecDeg = decToDeg(data.dec);
        const modelDistAU = parseDistanceToAU(data.dist);
        const modelElongDeg = parseFloat(data.elongation) || 0;

        let raDiff = Math.abs(row.raDeg - modelRaDeg);
        if (raDiff > 180) raDiff = 360 - raDiff;
        if (raDiff > job.deviations[planetName].maxErrors.maxRaDev)
          job.deviations[planetName].maxErrors.maxRaDev = raDiff;

        const decDiff = Math.abs(row.decDeg - modelDecDeg);
        if (decDiff > job.deviations[planetName].maxErrors.maxDecDev)
          job.deviations[planetName].maxErrors.maxDecDev = decDiff;

        let distDiff = null;
        if (row.distAU !== null) {
          distDiff = Math.abs(row.distAU - modelDistAU);
          if (distDiff > job.deviations[planetName].maxErrors.maxDistDev)
            job.deviations[planetName].maxErrors.maxDistDev = distDiff;
        }

        if (row.elongDeg !== null) {
          const elongDiff = Math.abs(row.elongDeg - modelElongDeg);
          if (elongDiff > job.deviations[planetName].maxErrors.maxElongDev)
            job.deviations[planetName].maxErrors.maxElongDev = elongDiff;
        }

        job.deviations[planetName].rows.push({
          raErr: raDiff,
          decErr: decDiff,
          distErr: distDiff,
        });

        const raRad = row.raDeg * (Math.PI / 180);
        const decRad = row.decDeg * (Math.PI / 180);
        const dist = row.distAU !== null ? row.distAU * 100 : 100;

        const localCoords = sphericalToCartesian(raRad, decRad, dist);
        const ephemerisPos = new THREE.Vector3(
          localCoords.x,
          localCoords.y,
          localCoords.z
        );

        const raRadMod = modelRaDeg * (Math.PI / 180);
        const decRadMod = modelDecDeg * (Math.PI / 180);
        const distMod = modelDistAU !== null ? modelDistAU * 100 : 100;

        const localCoordsMod = sphericalToCartesian(
          raRadMod,
          decRadMod,
          distMod
        );
        const modelPos = new THREE.Vector3(
          localCoordsMod.x,
          localCoordsMod.y,
          localCoordsMod.z
        );

        const earthObj = plotObjects.find((p) => p.name === "Earth");
        if (earthObj && earthObj.cSphereRef?.current) {
          earthObj.cSphereRef.current.localToWorld(ephemerisPos);
          earthObj.cSphereRef.current.localToWorld(modelPos);
        }

        job.rawPoints.push({
          planet: planetName,
          position: [ephemerisPos.x, ephemerisPos.y, ephemerisPos.z],
          date: row.date,
          time: row.time,
          ra: row.raStr,
          dec: row.decStr,
          dist: row.distAU,
          raErr: raDiff,
          decErr: decDiff,
          distErr: distDiff,
        });

        job.rawModelPoints.push({
          planet: planetName,
          position: [modelPos.x, modelPos.y, modelPos.z],
        });

        job.currentRowIdx++;
        job.processedRows++;
        batchCount++;
      } else {
        job.currentPlanetIdx++;
        job.currentRowIdx = 0;
      }
    }

    setProgress(
      Math.floor((job.processedRows / Math.max(1, job.totalRows)) * 100)
    );

    if (job.currentPlanetIdx >= job.planets.length) {
      setResults({ ...job.deviations });

      const positions = [];
      const colors = [];
      const pointsData = [];

      const mPositions = [];
      const mColors = [];

      job.rawPoints.forEach((pt, i) => {
        const pSetting = settings.find((s) => s.name === pt.planet);
        const color = new THREE.Color(pSetting?.color || "#ffffff");

        positions.push(pt.position[0], pt.position[1], pt.position[2]);
        colors.push(color.r, color.g, color.b);
        pointsData.push(pt);

        const mPt = job.rawModelPoints[i];
        mPositions.push(mPt.position[0], mPt.position[1], mPt.position[2]);
        mColors.push(color.r, color.g, color.b);
      });

      setVisualPoints({
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        pointsData,
      });

      setModelPoints({
        positions: new Float32Array(mPositions),
        colors: new Float32Array(mColors),
      });

      setChecking(false);
      setIsChecking(false);
    }
  });

  useEffect(() => {
    if (pointsRef.current && visualPoints?.positions) {
      const geo = pointsRef.current.geometry;
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(visualPoints.positions, 3)
      );
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(visualPoints.colors, 3)
      );
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }
  }, [visualPoints]);

  useEffect(() => {
    if (modelPointsRef.current && modelPoints?.positions) {
      const geo = modelPointsRef.current.geometry;
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(modelPoints.positions, 3)
      );
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(modelPoints.colors, 3)
      );
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeBoundingBox();
      geo.computeBoundingSphere();
    }
  }, [modelPoints]);

  const customRaycast = useCallback(
    (raycaster, intersects) => {
      if (!pointsRef.current || !visualPoints?.positions || !showPlot) return;
      const { camera, size, pointer } = getThreeState();
      const posArray = visualPoints.positions;
      const matrixWorld = pointsRef.current.matrixWorld;
      const HOVER_RADIUS_PX = Math.max(plotSize, 6);
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
            distance: raycaster.ray.origin.distanceTo(_worldPos) * 1.0001,
            distanceToRay: Math.sqrt(distSq),
            point: _worldPos.clone(),
            index: i,
            face: null,
            object: pointsRef.current,
          });
        }
      }
    },
    [getThreeState, visualPoints, plotSize, showPlot]
  );

  const handlePointerMove = (e) => {
    if (e.index !== undefined && visualPoints?.pointsData) {
      const pt = visualPoints.pointsData[e.index];
      const pSetting = settings.find((s) => s.name === pt.planet);
      setHoveredData({
        pt,
        x: e.clientX,
        y: e.clientY,
        color: pSetting?.color || "#ffffff",
      });
    }
  };

  const handlePointerOut = () => setHoveredData(null);

  useEffect(() => {
    if (!showPlot) setHoveredData(null);
  }, [showPlot]);

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

    const distStr =
      hoveredData.pt.dist !== null ? hoveredData.pt.dist.toFixed(6) : "N/A";

    const raErrVal =
      hoveredData.pt.raErr !== undefined
        ? hoveredData.pt.raErr.toFixed(4)
        : "0.0000";
    const decErrVal =
      hoveredData.pt.decErr !== undefined
        ? hoveredData.pt.decErr.toFixed(4)
        : "0.0000";
    const distErrVal =
      hoveredData.pt.distErr !== null && hoveredData.pt.distErr !== undefined
        ? hoveredData.pt.distErr.toFixed(6)
        : "0.000000";

    const raErrHtml =
      raErrVal !== "0.0000"
        ? `<span style="color: #ff8888; margin-left: 6px;">[Err: ${raErrVal}°]</span>`
        : "";
    const decErrHtml =
      decErrVal !== "0.0000"
        ? `<span style="color: #ff8888; margin-left: 6px;">[Err: ${decErrVal}°]</span>`
        : "";
    const distErrHtml =
      distErrVal !== "0.000000" && hoveredData.pt.dist !== null
        ? `<span style="color: #ff8888; margin-left: 6px;">[Err: ${distErrVal} AU]</span>`
        : "";

    el.innerHTML = `
      <strong style="color: ${hoveredData.color}; font-size: 14px;">${hoveredData.pt.planet}</strong><br />
      <span style="color: #aaa;">Date:</span> <span style="color: #fff; font-weight: bold;">${hoveredData.pt.date}</span><br />
      <span style="color: #aaa;">Time:</span> <span style="color: #fff;">${hoveredData.pt.time}</span><br />
      <span style="color: #aaa;">RA:</span> <span style="color: #fff;">${hoveredData.pt.ra}</span>${raErrHtml}<br />
      <span style="color: #aaa;">Dec:</span> <span style="color: #fff;">${hoveredData.pt.dec}</span>${decErrHtml}<br />
      <span style="color: #aaa;">AU:</span> <span style="color: #fff;">${distStr}</span>${distErrHtml}
    `;

    document.body.appendChild(el);
    return () => {
      if (document.body.contains(el)) document.body.removeChild(el);
    };
  }, [hoveredData]);

  if (!showChecker || !visualPoints?.positions) return null;

  return (
    <group>
      <points
        ref={pointsRef}
        raycast={customRaycast}
        onPointerMove={showPlot ? handlePointerMove : undefined}
        onPointerOut={showPlot ? handlePointerOut : undefined}
        visible={showPlot}
      >
        <bufferGeometry />
        <pointsMaterial
          size={plotSize}
          vertexColors
          sizeAttenuation={false}
          depthTest={false}
          map={circleTexture}
          transparent={true}
          alphaTest={0.5}
        />
      </points>

      {modelPoints?.positions && (
        <points ref={modelPointsRef} visible={showPlot} raycast={() => null}>
          <bufferGeometry />
          <pointsMaterial
            size={plotSize}
            vertexColors
            sizeAttenuation={false}
            depthTest={false}
            map={circleTexture}
            transparent={true}
            opacity={checkPlotOpacity}
            alphaTest={0.05}
          />
        </points>
      )}
    </group>
  );
};

export default CheckerController;
