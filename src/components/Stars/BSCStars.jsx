import { useRef, useMemo, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Vector3, Quaternion } from "three";
import { usePlotStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
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
  const currentHoverIndex = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // NEW: Ref to track if mouse is held down
  const mouseDownRef = useRef(false);

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

  // ... (ignoreSet and useEffect for selectedStarHR remain the same) ...
  const ignoreSet = useMemo(() => {
    const set = new Set();
    specialStarsData.forEach((s) => {
      if (s.HR) set.add(`HR:${String(s.HR)}`);
      if (s.HIP) set.add(`HIP:${String(s.HIP)}`);
      if (s.name === "Barnard's star") set.add("HIP:87937");
      if (s.name === "Proxima Centauri") set.add("HIP:70890");
    });
    return set;
  }, []);

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
        if (!selectedStarHR.includes(":")) {
          setSelectedStarPosition(null);
        }
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
      if (!selectedStarHR) {
        setSelectedStarPosition(null);
      }
    }
  }, [selectedStarHR, ignoreSet]);

  // ... (useMemo for geometry data remains the same) ...
  const { positions, colors, pickingColors, starData, magnitudes } =
    useMemo(() => {
      const positions = [];
      const colors = [];
      const pickingColors = [];
      const starData = [];
      const magnitudes = [];

      colorMap.current.clear();
      let validIndex = 0;

      bscSettings.forEach((s) => {
        const isIgnored =
          (s.HR && ignoreSet.has(`HR:${s.HR}`)) ||
          (s.HIP && ignoreSet.has(`HIP:${s.HIP}`));

        if (isIgnored) return;

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
        const colorIndex = validIndex + 1;
        const r = (colorIndex & 0xff) / 255;
        const g = ((colorIndex >> 8) & 0xff) / 255;
        const b = ((colorIndex >> 16) & 0xff) / 255;
        pickingColors.push(r, g, b);
        const rInt = Math.round(r * 255);
        const gInt = Math.round(g * 255);
        const bInt = Math.round(b * 255);
        const hexColor = (rInt << 16) | (gInt << 8) | bInt;
        colorMap.current.set(hexColor, validIndex);
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
          index: validIndex,
        });
        validIndex++;
      });
      return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        pickingColors: new Float32Array(pickingColors),
        starData,
        magnitudes,
      };
    }, [officialStarDistances, hScale, starDistanceModifier, ignoreSet]);

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

    // NEW: Listeners for mouse state
    const onMouseDown = () => {
      mouseDownRef.current = true;
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };

    canvas.addEventListener("mousemove", handleHover);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("resize", updateRenderTarget);
      canvas.removeEventListener("mousemove", handleHover);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);

      if (pickingRenderTarget.current) pickingRenderTarget.current.dispose();
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [gl, camera, planetCamera]);

  const handleClick = (event) => {
    if (useStore.getState().runIntro) return;
    if (currentHoverDataRef.current && onStarClick) {
      onStarClick(currentHoverDataRef.current, event);
    }
  };

  const handleHover = (event) => {
    // NEW: If mouse is down, do not process hover
    if (useStore.getState().runIntro || mouseDownRef.current) {
      // Optional: Clear hover if user starts dragging while hovering
      if (mouseDownRef.current && currentHoverIndex.current !== null) {
        currentHoverIndex.current = null;
        currentHoverDataRef.current = null;
        setHoveredPoint(null);
        if (onStarHover) onStarHover(null);
      }
      return;
    }

    if (!pickingPointsRef.current || !pickingRenderTarget.current) return;

    const { clientX, clientY } = event;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      // Double check mouse state before performing expensive picking
      if (!mouseDownRef.current) {
        performPickingCheck(clientX, clientY);
      }
    }, 150);
  };

  const performPickingCheck = (clientX, clientY) => {
    if (!gl || !pickingPointsRef.current || !pickingRenderTarget.current)
      return;

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

          if (onStarHover) onStarHover(hoverData, null);
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

  // ... (rest of the file: useEffects for points updates, plot object sync, label handling, and return JSX) ...
  useEffect(() => {
    if (pointsRef.current) {
      // ... (attribute updates)
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
      // ... (attribute updates)
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
      // ... (plot sync logic)
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
      // ... (label logic)
      const isSpecial = specialStarsData.some(
        (s) => s.name.toLowerCase() === query.toLowerCase()
      );
      if (isSpecial) return;
      const bscIndex = bscSettings.findIndex(
        (s) =>
          (s.N && s.N.toLowerCase() === query.toLowerCase()) ||
          s.HIP === query ||
          s.HR === query
      );
      if (bscIndex === -1) return;
      const bscStar = bscSettings[bscIndex];
      const isIgnored =
        (bscStar.HR && ignoreSet.has(`HR:${bscStar.HR}`)) ||
        (bscStar.HIP && ignoreSet.has(`HIP:${bscStar.HIP}`));
      if (isIgnored) return;
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
  }, [starData, setLabeledStarPosition, plotObjects, ignoreSet]);

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
