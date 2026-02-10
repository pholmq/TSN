// src/components/Stars/starShaders.js
import * as THREE from "three";

/**
 * Creates a circular texture for star rendering
 * @param {boolean} soft - If true, creates a fuzzy gradient. If false, creates a solid circle.
 * @returns {THREE.Texture} A texture for the point material
 */
function createStarTexture(soft = false) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const center = size / 2;
  const radius = size / 2 - 2;

  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);

  if (soft) {
    // Create a radial gradient for the "fuzzy" look
    // Center (white) -> Edge (transparent)
    const gradient = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      radius
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 1)"); // Solid core (20%)
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)"); // Soft falloff
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Fade to nothing
    context.fillStyle = gradient;
  } else {
    // Solid white for picking (hit testing)
    context.fillStyle = "white";
  }

  context.fill();
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create two textures: one for looks (fuzzy), one for logic (solid)
const visualTexture = createStarTexture(true);
const pickingTexture = createStarTexture(false);

/**
 * Shader material configuration for visible stars
 * Renders stars with color and opacity
 */
export const pointShaderMaterial = {
  uniforms: {
    pointTexture: { value: visualTexture }, // Use the fuzzy texture here
    opacity: { value: 1.0 },
    alphaTest: { value: 0.01 }, // Lower threshold to allow softer edges to render
  },
  vertexShader: `
    attribute float size;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size;
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
};

/**
 * Shader material configuration for GPU-based star picking
 * Renders stars with unique colors for pixel-perfect picking
 */
export const pickingShaderMaterial = {
  uniforms: {
    pointTexture: { value: pickingTexture }, // Keep using the solid texture for accurate picking
    alphaTest: { value: 0.1 },
  },
  vertexShader: `
    attribute float size;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D pointTexture;
    uniform float alphaTest;
    varying vec3 vColor;
    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      if (texColor.a < alphaTest) discard;
      gl_FragColor = vec4(vColor, texColor.a);
    }
  `,
  vertexColors: true,
  transparent: false,
};
