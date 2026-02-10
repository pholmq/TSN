import { useRef, useMemo, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Vector3, Quaternion } from "three";
import { usePlotStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { useStore } from "../../store";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";
import colorTemperature2rgb from "../../utils/colorTempToRGB";
import { pointShaderMaterial, pickingShaderMaterial } from "./starShaders";
import { LABELED_STARS } from "./LabeledStars";

const BSCStars = ({ onStarClick, onStarHover }) => {
  const pointsRef = useRef();
  const starGroupRef = useRef();
  const pickingPointsRef = useRef();
  const pickingRenderTarget = useRef();

  const [pickingScene] = useState(() => new THREE.Scene());

  const colorMap = useRef(new Map());
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { scene, camera, gl } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const lastHoverTime = useRef(0);
  const currentHoverIndex = useRef(null);
  const debugPicking = useRef(false);

  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const hScale = useStore((s) => s.hScale);
  const starScale = useStore((s) => s.starScale);
  const starPickingSensitivity = useStore((s) => s.starPickingSensitivity);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);
  const planetCamera = useStore((s) => s.planetCamera);
  const setLabeledStarPosition = useStore((s) => s.setLabeledStarPosition);

  // Reusable buffer
  const pixelBufferRef = useRef(new Uint8Array(4));
  const currentHoverDataRef = useRef(null);

  useEffect(() => {
    if (selectedStarHR && starData.length > 0 && pointsRef.current) {
      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(selectedStarHR)
      );
      if (!star) {
        setSelectedStarPosition(null);
        return;
      }
      const starIndex = star.index;
      const positions =
        pickingPointsRef.current.geometry.attributes.position.array;
      const x = positions[starIndex * 3];
      const y = positions[starIndex * 3 + 1];
      const z = positions[starIndex * 3 + 2];
      const pos = new THREE.Vector3(x, y, z);
      pickingPointsRef.current.localToWorld(pos);
      setSelectedStarPosition(pos);
    } else {
      setSelectedStarPosition(null);
    }
  }, [selectedStarHR]);

  // OPTIMIZATION: Memoize Static Data (Heavy)
  // 'starScale' is REMOVED from dependencies here to prevent heavy recalcs on zoom
  const { positions, colors, pickingColors, starData, magnitudes } =
    useMemo(() => {
      const positions = [];
      const colors = [];
      const pickingColors = [];
      const starData = [];
      const magnitudes = []; // New array to store magnitudes for size calculation

      colorMap.current.clear();

      bscSettings.forEach((s, index) => {
        const magnitude = parseFloat(s.V);
        const colorTemp = parseFloat(s.K) || 5778;

        const raRad = rightAscensionToRadians(s.RA);
        const decRad = declinationToRadians(s.Dec);

        const distLy = parseFloat(s.P) * 3.26156378;
        let dist;
        if (!officialStarDistances) {
          dist = (20000 * hScale) / 100;
        } else {
          const worldDist = distLy * 63241 * 100;
          dist =
            worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1);
        }

        const { x, y, z } = sphericalToCartesian(raRad, decRad, dist);
        positions.push(x, y, z);

        const { red, green, blue } = colorTemperature2rgb(colorTemp, true);
        colors.push(red, green, blue);

        const colorIndex = index + 1;
        const r = (colorIndex & 0xff) / 255;
        const g = ((colorIndex >> 8) & 0xff) / 255;
        const b = ((colorIndex >> 16) & 0xff) / 255;

        pickingColors.push(r, g, b);

        const rInt = Math.round(r * 255);
        const gInt = Math.round(g * 255);
        const bInt = Math.round(b * 255);
        const hexColor = (rInt << 16) | (gInt << 8) | bInt;

        colorMap.current.set(hexColor, index);

        // Cache magnitude
        const validMag = isNaN(magnitude) ? 5 : magnitude;
        magnitudes.push(validMag);

        starData.push({
          name:
            s.N && s.HIP
              ? `${s.N} / HIP ${s.HIP}`
              : s.HIP
              ? `HIP ${s.HIP}`
              : `HR ${s.HR}`,
          HR: s.HR,
          magnitude: validMag,
          colorTemp,
          ra: s.RA,
          dec: s.Dec,
          distLy,
          index: index,
        });
      });

      return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        pickingColors: new Float32Array(pickingColors),
        starData,
        magnitudes,
      };
    }, [officialStarDistances, hScale, starDistanceModifier]); // <-- No starScale here!

  // OPTIMIZATION: Memoize Sizes (Light)
  // This is the ONLY part that runs when you zoom in/out (changing starScale)
  const { sizes, pickingSizes } = useMemo(() => {
    const sizes = [];
    const pickingSizes = [];

    magnitudes.forEach((magnitude) => {
      let starsize;
      if (magnitude < 1) starsize = 1.2;
      else if (magnitude > 1 && magnitude < 3) starsize = 0.6;
      else if (magnitude > 3 && magnitude < 5) starsize = 0.4;
      else starsize = 0.2;

      const visualSize = starsize * starScale * 10;
      let pickingSize;
      if (magnitude >= 3) {
        pickingSize = visualSize * starPickingSensitivity;
      } else {
        pickingSize = visualSize;
      }

      sizes.push(visualSize);
      pickingSizes.push(pickingSize);
    });

    return {
      sizes: new Float32Array(sizes),
      pickingSizes: new Float32Array(pickingSizes),
    };
  }, [magnitudes, starScale, starPickingSensitivity]);

  // Setup Picking
  useEffect(() => {
    if (!gl || !camera) return;
    pickingRenderTarget.current = new THREE.WebGLRenderTarget(1, 1);
    pickingRenderTarget.current.samples = 0;

    const updateRenderTarget = () => {
      const { width, height } = gl.domElement;
      pickingRenderTarget.current.setSize(width, height);
    };
    window.addEventListener("resize", updateRenderTarget);
    updateRenderTarget();

    const canvas = gl.domElement;
    canvas.addEventListener("mousemove", handleHover);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", updateRenderTarget);
      canvas.removeEventListener("mousemove", handleHover);
      canvas.removeEventListener("click", handleClick);
      if (pickingRenderTarget.current) pickingRenderTarget.current.dispose();
    };
  }, [gl, camera, planetCamera]);

  const handleClick = (event) => {
    if (useStore.getState().runIntro) return;
    if (currentHoverDataRef.current && onStarClick) {
      onStarClick(currentHoverDataRef.current, event);
    }
  };

  const handleHover = (event) => {
    if (useStore.getState().runIntro) return;
    if (!pickingPointsRef.current || !pickingRenderTarget.current) return;

    const now = performance.now();
    if (now - lastHoverTime.current < 200) return;
    lastHoverTime.current = now;

    const { clientX, clientY } = event;
    const { width, height } = gl.domElement;
    const rect = gl.domElement.getBoundingClientRect();

    const x = Math.round((clientX - rect.left) * (width / rect.width));
    const y = Math.round((clientY - rect.top) * (height / rect.height));

    gl.setRenderTarget(pickingRenderTarget.current);
    gl.setScissorTest(true);
    gl.setScissor(x, height - y, 1, 1);
    gl.clear();
    gl.render(pickingScene, camera);
    gl.setScissorTest(false);
    gl.setRenderTarget(null);

    const pixelBuffer = pixelBufferRef.current;

    const processPixel = () => {
      const hexColor =
        (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
      const starIndex = colorMap.current.get(hexColor);

      if (starIndex !== undefined) {
        if (currentHoverIndex.current !== starIndex) {
          currentHoverIndex.current = starIndex;
          setHoveredPoint(starIndex);

          const star = starData[starIndex];
          const positions =
            pickingPointsRef.current.geometry.attributes.position.array;
          const px = positions[starIndex * 3];
          const py = positions[starIndex * 3 + 1];
          const pz = positions[starIndex * 3 + 2];
          const worldPosition = new THREE.Vector3(px, py, pz);
          pickingPointsRef.current.localToWorld(worldPosition);

          const hoverData = { star, position: worldPosition, index: starIndex };
          currentHoverDataRef.current = hoverData;
          onStarHover(hoverData, event);
        }
      } else {
        if (currentHoverIndex.current !== null) {
          currentHoverIndex.current = null;
          currentHoverDataRef.current = null;
          setHoveredPoint(null);
          if (onStarHover) onStarHover(null);
        }
      }
    };

    if (gl.readRenderTargetPixelsAsync) {
      gl.readRenderTargetPixelsAsync(
        pickingRenderTarget.current,
        x,
        height - y,
        1,
        1,
        pixelBuffer
      )
        .then(processPixel)
        .catch(() => {});
    } else {
      gl.readRenderTargetPixels(
        pickingRenderTarget.current,
        x,
        height - y,
        1,
        1,
        pixelBuffer
      );
      processPixel();
    }
  };

  useEffect(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }
    if (pickingPointsRef.current) {
      const geometry = pickingPointsRef.current.geometry;
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(pickingColors, 3)
      );
      geometry.setAttribute("size", new THREE.BufferAttribute(pickingSizes, 1));
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }
  }, [positions, colors, pickingColors, sizes, pickingSizes]);

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
      if (pickingPointsRef.current && pickingScene) {
        pickingPointsRef.current.position.copy(worldPosition);
        pickingPointsRef.current.quaternion.copy(worldQuaternion);
      }
    }
  }, [plotObjects, pickingScene]);

  useEffect(() => {
    if (pickingPointsRef.current && pickingScene) {
      pickingScene.add(pickingPointsRef.current);
      return () => {
        if (pickingScene && pickingPointsRef.current)
          pickingScene.remove(pickingPointsRef.current);
      };
    }
  }, [pickingPointsRef.current, pickingScene]);

  useEffect(() => {
    if (starData.length === 0 || !pickingPointsRef.current) return;
    LABELED_STARS.forEach((query) => {
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
      const positions =
        pickingPointsRef.current.geometry.attributes.position.array;
      const x = positions[starIndex * 3];
      const y = positions[starIndex * 3 + 1];
      const z = positions[starIndex * 3 + 2];
      const pos = new THREE.Vector3(x, y, z);
      pickingPointsRef.current.localToWorld(pos);
      let displayName =
        bscStar.N || (bscStar.HIP ? `HIP ${bscStar.HIP}` : `HR ${bscStar.HR}`);
      setLabeledStarPosition(bscStar.HR, pos, displayName);
    });
    return () => {
      LABELED_STARS.forEach((query) => {
        const bscIndex = bscSettings.findIndex(
          (s) =>
            (s.N && s.N.toLowerCase() === query.toLowerCase()) ||
            s.HIP === query ||
            s.HR === query
        );
        if (bscIndex !== -1) {
          const bscStar = bscSettings[bscIndex];
          setLabeledStarPosition(bscStar.HR, null);
        }
      });
    };
  }, [starData, setLabeledStarPosition, plotObjects]);

  return (
    <>
      <group ref={starGroupRef}>
        <points ref={pointsRef} raycast={() => null}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={positions}
              count={positions.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={colors}
              count={colors.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              array={sizes}
              count={sizes.length}
              itemSize={1}
            />
          </bufferGeometry>
          <shaderMaterial attach="material" args={[pointShaderMaterial]} />
        </points>
      </group>
      <points ref={pickingPointsRef} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={pickingColors}
            count={pickingColors.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={pickingSizes}
            count={pickingSizes.length}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial attach="material" args={[pickingShaderMaterial]} />
      </points>
    </>
  );
};

export default BSCStars;
