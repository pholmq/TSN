// src/components/Stars/starShaders.js
import * as THREE from "three";

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
    const gradient = context.createRadialGradient(
      center, center, 0, center, center, radius
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
  } else {
    context.fillStyle = "white";
  }

  context.fill();
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Only the visual texture is needed now
const visualTexture = createStarTexture(true);

export const pointShaderMaterial = {
  uniforms: {
    pointTexture: { value: visualTexture },
    opacity: { value: 1.0 },
    alphaTest: { value: 0.01 },
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