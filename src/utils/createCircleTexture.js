import { CanvasTexture } from 'three';
// Function to create a circular texture
export default function createCircleTexture(color) {
    const canvas = document.createElement("canvas");
    const size = 128; // Texture size
    canvas.width = size;
    canvas.height = size;
  
    const context = canvas.getContext("2d");
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
  
    const texture = new CanvasTexture(canvas);
    return texture;
  }