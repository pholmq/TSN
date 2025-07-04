import { useRef, useMemo, useState, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Vector3, Quaternion } from "three";
import { usePlotStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import { dateTimeToPos } from "../../utils/time-date-functions";

// Parse RA (e.g., '00h 05m 09.9s') to decimal hours
function parseRA(raStr) {
  if (typeof raStr !== "string") return NaN;
  const match = raStr.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);
  if (!match) return NaN;
  const hours = parseFloat(match[1]);
  const minutes = parseFloat(match[2]);
  const seconds = parseFloat(match[3]);
  return hours + minutes / 60 + seconds / 3600;
}

// Parse Dec (e.g., '+45° 13′ 45″') to decimal degrees
function parseDec(decStr) {
  if (typeof decStr !== "string") return NaN;
  const match = decStr.match(/([+-]?)(\d+)°\s*(\d+)′\s*([\d.]+)″/);
  if (!match) return NaN;
  const sign = match[1] === "-" ? -1 : 1;
  const degrees = parseFloat(match[2]);
  const arcminutes = parseFloat(match[3]);
  const arcseconds = parseFloat(match[4]);
  return sign * (degrees + arcminutes / 60 + arcseconds / 3600);
}

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

  // Create circular texture
  const circleTexture = useMemo(() => createCircleTexture(), []);

  // Log camera settings for debugging
  useEffect(() => {
    console.log("Camera settings:", {
      position: camera.position.toArray(),
      near: camera.near,
      far: camera.far,
      fov: camera.fov,
    });
    // Optional: Adjust camera for testing
    /*
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);
    camera.far = 10000;
    camera.updateProjectionMatrix();
    */
  }, [camera]);

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
      const raHours = parseRA(s.RA);
      const decDegrees = parseDec(s.Dec);
      const parallax = parseFloat(s.P);
      const magnitude = parseFloat(s.V);
      const colorTemp = parseFloat(s.K) || 5778;

      // Validate data
      if (isNaN(raHours) || isNaN(decDegrees) || isNaN(parallax)) {
        console.warn(`Invalid data for star ${s.N || s.HR} at index ${index}`, {
          RA: s.RA,
          Dec: s.Dec,
          P: s.P,
          parsed: { raHours, decDegrees, parallax },
        });
        return;
      }

      const ra = raHours * (Math.PI / 12); // RA in hours to radians
      const dec = decDegrees * (Math.PI / 180); // Dec in degrees to radians
      const distLy = parallax * 3.26156378; // Parsecs to light-years

      // Convert spherical to Cartesian
      const x = distLy * Math.cos(dec) * Math.cos(ra) * scale;
      const y = distLy * Math.cos(dec) * Math.sin(ra) * scale;
      const z = distLy * Math.sin(dec) * scale;
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        console.warn(
          `Invalid position for star ${s.N || s.HR} at index ${index}`,
          { x, y, z }
        );
        return;
      }
      positions.push(x, y, z);

      // Color based on colorTemp
      let r, g, b;
      if (colorTemp < 3500) {
        r = 1.0;
        g = Math.max(0, (colorTemp - 2000) / 1500);
        b = 0;
      } else if (colorTemp < 6000) {
        r = 1.0;
        g = 1.0;
        b = Math.max(0, (colorTemp - 3500) / 2500);
      } else {
        r = Math.max(0, (10000 - colorTemp) / 4000);
        g = Math.max(0, (8000 - colorTemp) / 2000);
        b = 1.0;
      }
      colors.push(r, g, b);

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
      starData.push({
        name: s.N ? s.N : "HR " + s.HR,
        magnitude: isNaN(magnitude) ? 5 : magnitude,
        colorTemp,
        ra: raHours,
        dec: decDegrees,
        distLy,
      });
    });

    // Log for debugging
    console.log("Star count:", starData.length);
    console.log("Sample positions:", positions.slice(0, 12));
    console.log("Sample sizes:", sizes.slice(0, 4));

    // Add a test point at origin
    positions.push(0, 0, 0);
    colors.push(1, 1, 1); // White
    sizes.push(5); // Large size
    starData.push({ name: "Test Point", magnitude: 0, distLy: 0 });

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
      starData,
    };
  }, []); // Empty deps since BSC.json is static


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
      <axesHelper args={[1000]} />
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
