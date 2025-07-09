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
// import createCircleTexture from "../../utils/createCircleTexture";

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

const BSCStars = () => {
  const pointsRef = useRef();
  const starGroupRef = useRef();
  const plotObjects = usePlotStore((s) => s.plotObjects);

  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const starScale = useStore((s) => s.starScale);

  // Create ShaderMaterial
  const pointShaderMaterial = useMemo(
    () => ({
      uniforms: {
        pointTexture: { value: createCircleTexture() },
        opacity: { value: 1.0 },
        alphaTest: { value: 0.1 },
      },
      vertexShader: `
    attribute float size;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size; // Pixel-based size
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
      fragmentShader: `
    uniform sampler2D pointTexture;
    uniform float opacity;
    uniform float alphaTest;
    varying vec3 vColor;
    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      if (texColor.a < alphaTest) discard;
      gl_FragColor = vec4(vColor, texColor.a * opacity);
    }
  `,
      vertexColors: true,
      transparent: true,
    }),
    []
  );

  //Put the starGroup in Epoch J2000 orientation
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

  // Memoize star attributes from BSC.json
  const { positions, colors, sizes, starData } = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];
    const starData = [];
    const scale = 0.1; // Scale down distances to ensure visibility (adjust as needed)

    // Iterate over BSC.json
    bscSettings.forEach((s, index) => {
      // Parse string fields to numbers
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

      const { red, green, blue } = colorTemperature2rgb(colorTemp, true);

      colors.push(red, green, blue);

      // Size is based on magnitude
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

      const size = starsize * starScale * 10;

      sizes.push(size);

      // Store metadata for mouseover
      starData.push({
        name: s.N ? s.N : "HR " + s.HR,
        magnitude: isNaN(magnitude) ? 5 : magnitude,
        colorTemp,
        ra: s.RA,
        dec: s.Dec,
        distLy,
      });
    });

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
      starData,
    };
  }, [officialStarDistances, starDistanceModifier, starScale]); // Update if these change

  // Update buffer attributes when positions or sizes change
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
  }, [positions, sizes]);

  return (
    <group ref={starGroupRef}>
      {/* <axesHelper args={[1000]} /> */}
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
  );
};

export default BSCStars;
