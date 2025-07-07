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
  convertMagnitude,
} from "../../utils/celestial-functions";
import colorTemperature2rgb from "../../utils/colorTempToRGB";

function moveModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}

// Create a circular texture for points
function createCircleTexture() {
  const size = 64; // Texture size (pixels)
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  // Draw a white circle with transparent background
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  context.fillStyle = "white";
  context.fill();

  // Create Three.js texture
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const BSCStars = () => {
  const pointsRef = useRef();
  const starGroupRef = useRef();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { scene, raycaster, camera, pointer } = useThree();
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  // Create circular texture
  const circleTexture = useMemo(() => createCircleTexture(), []);

  // Memoize star attributes directly from BSC.json
  const { positions, colors, sizes, starData } = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];
    const starData = [];
    const scale = 0.1; // Scale down distances to ensure visibility (adjust as needed)

    // Iterate over BSC.json
    bscSettings.forEach((s, index) => {
      // Parse string fields to numbers
      // const raHours = parseRA(s.RA);
      // const decDegrees = parseDec(s.Dec);
      const parallax = parseFloat(s.P);
      const magnitude = parseFloat(s.V);
      const colorTemp = parseFloat(s.K) || 5778;

      const raRad = rightAscensionToRadians(s.RA); // RA in hours to radians
      const decRad = declinationToRadians(s.Dec); // Dec in degrees to radians

      const distLy = parseFloat(s.P) * 3.26156378; // Parsecs to light-years
      let dist;
      if (!officialStarDistances) {
        dist = 20000;
      } else {
        //Convert light year distance to world units (1Ly = 63241 AU, 1 AU = 100 world units)
        const worldDist = distLy * 63241 * 100;
        dist =
          worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1); // Distance
      }

      // Convert spherical coordinates (RA, Dec, Dist) to Cartesian coordinates (x, y, z)
      const { x, y, z } = sphericalToCartesian(raRad, decRad, dist);
      // Set the position of the star
      // console.log(x, y, z);
      positions.push(x, y, z);

      // Color based on colorTemp
      // let r, g, b;
      // if (colorTemp < 3500) {
      //   r = 1.0;
      //   g = Math.max(0, (colorTemp - 2000) / 1500);
      //   b = 0;
      // } else if (colorTemp < 6000) {
      //   r = 1.0;
      //   g = 1.0;
      //   b = Math.max(0, (colorTemp - 3500) / 2500);
      // } else {
      //   r = Math.max(0, (10000 - colorTemp) / 4000);
      //   g = Math.max(0, (8000 - colorTemp) / 2000);
      //   b = 1.0;
      // }

      const { red, green, blue } = colorTemperature2rgb(colorTemp, true);

      colors.push(red, green, blue);

      // Size based on magnitude
      const size = Math.max(
        0.1,
        1.0 / (1 + (isNaN(magnitude) ? 5 : magnitude))
      );
      if (isNaN(size)) {
        console.warn(`Invalid size for star ${s.N || s.HR} at index ${index}`, {
          magnitude,
          size,
        });
        return;
      }
      sizes.push(size);

      // Store metadata for mouseover
      // starData.push({
      //   name: s.N ? s.N : "HR " + s.HR,
      //   magnitude: isNaN(magnitude) ? 5 : magnitude,
      //   colorTemp,
      //   ra: raHours,
      //   dec: decDegrees,
      //   distLy,
      // });
    });

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
      starData,
    };
  }, [officialStarDistances, starDistanceModifier]); // Update if these changes

  // Update buffer attributes when positions or sizes change
  useEffect(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;
    }
  }, [positions, sizes]);

  useEffect(() => {
    if (plotObjects.length > 0 && starGroupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      const worldPosition = new Vector3();
      const worldQuaternion = new Quaternion();
      //We move the plot model to Epoch J2000 and copy Earths position and tilt
      moveModel(plotObjects, epochJ2000Pos);
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      earthObj.cSphereRef.current.getWorldPosition(worldPosition);
      earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
      //And then we set the starGroup to this so that RA and Dec will be correct
      starGroupRef.current.position.copy(worldPosition);
      starGroupRef.current.quaternion.copy(worldQuaternion);
    }
  }, [plotObjects]);

  // Handle mouseover events
  const handlePointerMove = (event) => {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(pointsRef.current);
    if (intersects.length > 0) {
      const { index } = intersects[0];
      setHoveredPoint(index);
      document.body.style.cursor = "pointer";
    } else {
      setHoveredPoint(null);
      document.body.style.cursor = "default";
    }
  };

  // Update sizes for hover effect
  useFrame(() => {
    if (hoveredPoint !== null && pointsRef.current) {
      const sizesAttr = pointsRef.current.geometry.attributes.size;
      const sizesArray = sizesAttr.array;
      for (let i = 0; i < sizesArray.length; i++) {
        sizesArray[i] = sizes[i];
      }
      sizesArray[hoveredPoint] = sizes[hoveredPoint] * 2;
      sizesAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={starGroupRef}>
      {/* <axesHelper args={[1000]} /> */}
      <points
        ref={pointsRef}
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHoveredPoint(null)}
      >
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
        <pointsMaterial
          size={5}
          sizeAttenuation={false}
          vertexColors
          transparent
          opacity={1}
          alphaTest={0.5}
          map={circleTexture}
        />
      </points>
      {hoveredPoint !== null && (
        <group
          position={[
            positions[hoveredPoint * 3],
            positions[hoveredPoint * 3 + 1],
            positions[hoveredPoint * 3 + 2],
          ]}
        >
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="white" transparent opacity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default BSCStars;
