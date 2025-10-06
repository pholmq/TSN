// src/components/Stars/starShaders.js
import * as THREE from "three";

/**
 * Creates a circular texture for star rendering
 * @returns {THREE.Texture} A white circle texture
 */
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

// Create texture once at module load time
const circleTexture = createCircleTexture();

/**
 * Shader material configuration for visible stars
 * Renders stars with color and opacity
 */
export const pointShaderMaterial = {
  uniforms: {
    pointTexture: { value: circleTexture },
    opacity: { value: 1.0 },
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
    pointTexture: { value: circleTexture },
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
