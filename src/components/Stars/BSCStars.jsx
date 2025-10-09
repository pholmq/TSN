import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
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
import colorTemperature2rgb from "../../utils/colorTempToRGB";

import { pointShaderMaterial, pickingShaderMaterial } from "./starShaders";

import { LABELED_STARS } from "./LabeledStars";

function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}

function createCircleTexture() {
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

const BSCStars = ({ onStarClick, onStarHover }) => {
  const pointsRef = useRef();
  const starGroupRef = useRef();
  const pickingPointsRef = useRef();
  const pickingRenderTarget = useRef();
  const pickingScene = useRef();
  const colorMap = useRef(new Map());
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { scene, raycaster, camera, pointer, gl } = useThree();
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

  useEffect(() => {
    //Used by StarSearch
    if (selectedStarHR && starData.length > 0 && pointsRef.current) {
      const star = starData.find(
        (s) => parseInt(s.HR) === parseInt(selectedStarHR)
      );
      // console.log(starData);
      if (!star) {
        console.warn(`Star with HR ${selectedStarHR} not found.`);
        setSelectedStarPosition(null);
        return;
      }

      const starIndex = star.index;

      const positions =
        pickingPointsRef.current.geometry.attributes.position.array;
      const x = positions[starIndex * 3];
      const y = positions[starIndex * 3 + 1];
      const z = positions[starIndex * 3 + 2];

      // Create a Vector3 and transform to world space
      const pos = new THREE.Vector3(x, y, z);
      pickingPointsRef.current.localToWorld(pos);
      // console.log("Selected star position:", pos);

      setSelectedStarPosition(pos);
    } else {
      setSelectedStarPosition(null);
    }
  }, [selectedStarHR]);

  // Memoize star attributes with selective picking sensitivity
  const { positions, colors, sizes, pickingSizes, starData, pickingColors } =
    useMemo(() => {
      const positions = [];
      const colors = [];
      const pickingColors = [];
      const sizes = [];
      const pickingSizes = [];
      const starData = [];
      const scale = 0.1;

      // Clear previous color mapping
      colorMap.current.clear();

      // Iterate over BSC.json
      bscSettings.forEach((s, index) => {
        // Parse string fields to numbers
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

        // Generate unique picking color for this star
        const colorIndex = index + 1; // Start from 1 to avoid black
        const r = (colorIndex & 0xff) / 255;
        const g = ((colorIndex >> 8) & 0xff) / 255;
        const b = ((colorIndex >> 16) & 0xff) / 255;

        pickingColors.push(r, g, b);

        // Create hex color for lookup
        const rInt = Math.round(r * 255);
        const gInt = Math.round(g * 255);
        const bInt = Math.round(b * 255);
        const hexColor = (rInt << 16) | (gInt << 8) | bInt;

        colorMap.current.set(hexColor, index);

        // Size based on magnitude
        let starsize;
        if (magnitude < 1) {
          starsize = 1.2;
        } else if (magnitude > 1 && magnitude < 3) {
          starsize = 0.6;
        } else if (magnitude > 3 && magnitude < 5) {
          starsize = 0.4;
        } else {
          starsize = 0.2;
        }

        const visualSize = starsize * starScale * 10;

        // Apply picking sensitivity only to dim stars (magnitude 3+)
        let pickingSize;
        if (magnitude >= 3) {
          // Use sensitivity multiplier for dim stars
          pickingSize = visualSize * starPickingSensitivity;
        } else {
          // Bright stars keep their visual size for picking
          pickingSize = visualSize;
        }

        sizes.push(visualSize);
        pickingSizes.push(pickingSize);

        // Store metadata for mouseover
        starData.push({
          // Show name and HIP, or just HIP, or just HR:
          name: (() => {
            if (s.N && s.HIP) {
              return `${s.N} / HIP ${s.HIP}`;
            } else if (s.HIP) {
              return `HIP ${s.HIP}`;
            } else if (s.HR) {
              return `HR ${s.HR}`;
            }
            return "Unknown";
          })(),
          HR: s.HR,
          magnitude: isNaN(magnitude) ? 5 : magnitude,
          colorTemp,
          ra: s.RA,
          dec: s.Dec,
          distLy,
          index: index,
        });
      });

      // console.log(
      //   `Generated ${colorMap.current.size} unique colors for ${bscSettings.length} stars`
      // );

      return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        pickingColors: new Float32Array(pickingColors),
        sizes: new Float32Array(sizes),
        pickingSizes: new Float32Array(pickingSizes),
        starData,
      };
    }, [
      officialStarDistances,
      hScale,
      starDistanceModifier,
      starScale,
      starPickingSensitivity,
    ]);

  // Initialize picking setup
  useEffect(() => {
    if (!gl || !camera) return;

    // Create picking render target
    pickingRenderTarget.current = new THREE.WebGLRenderTarget(1, 1);
    pickingRenderTarget.current.samples = 0; // Disable anti-aliasing

    // Create picking scene
    pickingScene.current = new THREE.Scene();

    // Update render target size
    const updateRenderTarget = () => {
      const { width, height } = gl.domElement;
      pickingRenderTarget.current.setSize(width, height);
    };
    window.addEventListener("resize", updateRenderTarget);
    updateRenderTarget();

    // Add event listener
    const canvas = gl.domElement;
    canvas.addEventListener("mousemove", handleHover);

    // Debug toggle
    // const toggleDebug = (event) => {
    //   if (event.key === "p") {
    //     debugPicking.current = !debugPicking.current;
    //     console.log("Debug picking scene:", debugPicking.current);
    //   }
    // };
    // window.addEventListener("keydown", toggleDebug);

    return () => {
      window.removeEventListener("resize", updateRenderTarget);
      canvas.removeEventListener("mousemove", handleHover);
      // window.removeEventListener("keydown", toggleDebug);
      if (pickingRenderTarget.current) {
        pickingRenderTarget.current.dispose();
      }
    };
  }, [gl, camera, planetCamera]);

  // Handle hover (throttled)
  const handleHover = (event) => {
    if (!pickingPointsRef.current || !pickingRenderTarget.current) return;

    const now = performance.now();
    if (now - lastHoverTime.current < 300) return; // Throttle to 10Hz
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

    if (debugPicking.current) {
      gl.render(pickingScene.current, camera);
    }

    const pixelBuffer = new Uint8Array(4);
    gl.readRenderTargetPixels(
      pickingRenderTarget.current,
      x,
      height - y,
      1,
      1,
      pixelBuffer
    );

    const hexColor =
      (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | pixelBuffer[2];
    const starIndex = colorMap.current.get(hexColor);

    if (starIndex !== undefined) {
      if (currentHoverIndex.current !== starIndex) {
        currentHoverIndex.current = starIndex;
        setHoveredPoint(starIndex);

        const star = starData[starIndex];
        // Get the position attribute
        const positions =
          pickingPointsRef.current.geometry.attributes.position.array;
        // console.log(positions);
        // Get the specific point's local position
        const x = positions[starIndex * 3];
        const y = positions[starIndex * 3 + 1];
        const z = positions[starIndex * 3 + 2];

        // Create a Vector3 and transform to world space
        const worldPosition = new THREE.Vector3(x, y, z);
        pickingPointsRef.current.localToWorld(worldPosition);

        onStarHover({ star, position: worldPosition, index: starIndex }, event);
      }
    } else {
      if (currentHoverIndex.current !== null) {
        currentHoverIndex.current = null;
        setHoveredPoint(null);
        if (onStarHover) {
          onStarHover(null);
        }
      }
    }
  };

  // Update buffer attributes when positions, sizes, or picking sensitivity change
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

  // Update picking scene when star group transforms
  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      const worldPosition = new Vector3();
      const worldQuaternion = new Quaternion();

      moveModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);

      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);

      // Update picking scene transformation
      if (pickingPointsRef.current && pickingScene.current) {
        pickingPointsRef.current.position.copy(worldPosition);
        pickingPointsRef.current.quaternion.copy(worldQuaternion);
      }
    }
  }, [plotObjects]);

  // Add picking points to picking scene
  useEffect(() => {
    if (pickingPointsRef.current && pickingScene.current) {
      pickingScene.current.add(pickingPointsRef.current);
      return () => {
        if (pickingScene.current && pickingPointsRef.current) {
          pickingScene.current.remove(pickingPointsRef.current);
        }
      };
    }
  }, [pickingPointsRef.current, pickingScene.current]);

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

      // Now find it the SAME way StarSearch does
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
  }, [starData, setLabeledStarPosition, plotObjects]);

  return (
    <>
      <group ref={starGroupRef}>
        {/* Visible stars */}
        <points ref={pointsRef}>
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

      {/* Picking stars with selective sensitivity for dim stars */}
      <points ref={pickingPointsRef}>
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
