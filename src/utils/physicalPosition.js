import { Vector3 } from "three";
import { useStore } from "../store";
import { getPhysicalPositionInfo } from "./celestialModel";

/**
 * Create a reader for an object's physical world position in a Three.js scene.
 * Object references are resolved once, making the reader suitable for useFrame.
 * The output vector is supplied by the caller to avoid per-frame allocations.
 */
export function createPhysicalPositionReader(name, scene) {
  const target = scene?.getObjectByName(name);
  if (!target) return null;

  const info = getPhysicalPositionInfo(name);
  const scale = info?.scale;
  const anchor =
    scale && info.anchorName ? scene.getObjectByName(info.anchorName) : null;

  if (scale && (!info.anchorName || !anchor)) {
    console.warn(
      `physicalPosition: missing unscaled anchor "${info.anchorName}" for "${name}"`
    );
    return null;
  }

  const anchorPosition = new Vector3();

  return (out = new Vector3()) => {
    target.getWorldPosition(out);

    if (scale && anchor && !useStore.getState().actualPlanetSizes) {
      anchor.getWorldPosition(anchorPosition);
      out
        .sub(anchorPosition)
        .multiplyScalar(1 / scale)
        .add(anchorPosition);
    }

    return out;
  };
}

/** Get one object's physical world position. Returns null if it is not found. */
export function getPhysicalPosition(name, scene, out = new Vector3()) {
  const readPosition = createPhysicalPositionReader(name, scene);
  return readPosition ? readPosition(out) : null;
}

/**
 * Physical position reader for the hidden plot scene, which stores refs rather
 * than a direct scene-object lookup. Plot traces themselves intentionally keep
 * using their visually scaled positions; this helper is for physical RA/Dec,
 * distance and ephemeris calculations only.
 */
export function getPhysicalPositionFromPlotObjects(
  name,
  plotObjects,
  out = new Vector3()
) {
  const targetEntry = plotObjects.find((item) => item.name === name);
  const target = targetEntry?.pivotRef?.current;
  if (!target) return null;

  target.getWorldPosition(out);

  const info = getPhysicalPositionInfo(name);
  if (!info?.scale || useStore.getState().actualPlanetSizes) return out;

  if (!info.anchorName) {
    console.warn(`physicalPosition: no unscaled anchor defined for "${name}"`);
    return null;
  }

  const anchorEntry = plotObjects.find((item) => item.name === info.anchorName);
  const anchor = anchorEntry?.pivotRef?.current;
  if (!anchor) {
    console.warn(
      `physicalPosition: missing plot anchor "${info.anchorName}" for "${name}"`
    );
    return null;
  }

  const anchorPosition = new Vector3();
  anchor.getWorldPosition(anchorPosition);
  out
    .sub(anchorPosition)
    .multiplyScalar(1 / info.scale)
    .add(anchorPosition);
  return out;
}
