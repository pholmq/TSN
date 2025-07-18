import { CanvasTexture } from "three";
export default function createCrosshairTexture() {
  const CROSSHAIR_THICKNESS = 10; // You can adjust the thickness of the crosshair lines
  const CROSSHAIR_CIRCLE_RADIUS = 30; // Radius of the empty circle in the middle
  const CROSSHAIR_LINE_LENGTH = 0.4; // Proportion of the canvas size for line length (e.g., 0.4 means 40% of size)
  const CROSSHAIR_RING_RADIUS = 0.45; // Proportion of the canvas size for the ring radius

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const center = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Crosshair - Horizontal line
  ctx.beginPath();
  ctx.moveTo(center - (size * CROSSHAIR_LINE_LENGTH) / 2, center); // Left end
  ctx.lineTo(center + (size * CROSSHAIR_LINE_LENGTH) / 2, center); // Right end
  ctx.lineWidth = CROSSHAIR_THICKNESS;
  ctx.strokeStyle = "rgba(255, 255, 0, 1)";
  ctx.stroke();

  // Crosshair - Vertical line
  ctx.beginPath();
  ctx.moveTo(center, center - (size * CROSSHAIR_LINE_LENGTH) / 2); // Top end
  ctx.lineTo(center, center + (size * CROSSHAIR_LINE_LENGTH) / 2); // Bottom end
  ctx.lineWidth = CROSSHAIR_THICKNESS;
  ctx.strokeStyle = "rgba(255, 255, 0, 1)";
  ctx.stroke();

  // Cut out the center to make it empty
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(center, center, CROSSHAIR_CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Reset composite operation to default
  ctx.globalCompositeOperation = "source-over";

  // Add the surrounding ring
  ctx.beginPath();
  ctx.arc(center, center, (size * CROSSHAIR_RING_RADIUS) / 2, 0, Math.PI * 2);
  ctx.lineWidth = CROSSHAIR_THICKNESS; // Use the same thickness as the crosshair for consistency
  ctx.strokeStyle = "rgba(255, 255, 0, 1)";
  ctx.stroke();

  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
