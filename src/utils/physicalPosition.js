import { Vector3 } from "three";
import { useStore } from "../store";
import { getPhysicalPositionInfo, celestialModel } from "./celestialModel";

let cachedMoonChainNames = null;
const getMoonChainNames = () => {
  if (cachedMoonChainNames) return cachedMoonChainNames;
  cachedMoonChainNames = new Set();
  if (!celestialModel?.objects) return cachedMoonChainNames;
  
  let current = celestialModel.objects.find((o) => o.name === "Moon" || o.id === "moon");
  while (current && current.name !== "Earth" && current.name !== "SystemCenter") {
    cachedMoonChainNames.add(current.name);
    current = celestialModel.objects.find((o) => o.id === current.parentId);
  }
  return cachedMoonChainNames;
};

export function createPhysicalPositionReader(name, scene) {
  const target = scene?.getObjectByName(name);
  if (!target) return null;
  
  const info = getPhysicalPositionInfo(name);
  const isMoonChain = getMoonChainNames().has(name);
  const anchorName = isMoonChain ? "Earth" : info?.anchorName;
  const anchor = anchorName ? scene.getObjectByName(anchorName) : null;
  
  if (!isMoonChain && info?.scale && (!info.anchorName || !anchor)) {
    console.warn(`physicalPosition: missing unscaled anchor "${info.anchorName}" for "${name}"`);
    return null;
  }
  
  const anchorPosition = new Vector3();
  return (out = new Vector3()) => {
    target.getWorldPosition(out);
    const state = useStore.getState();
    const scale = isMoonChain ? (state.moonDisplayOrbitScale ?? 39.2078) : info?.scale;

    if (scale && anchor && !state.actualPlanetSizes) {
      anchor.getWorldPosition(anchorPosition);
      out
        .sub(anchorPosition)
        .multiplyScalar(1 / scale)
        .add(anchorPosition);
    }
    return out;
  };
}

export function getPhysicalPosition(name, scene, out = new Vector3()) {
  const readPosition = createPhysicalPositionReader(name, scene);
  return readPosition ? readPosition(out) : null;
}

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
  const isMoonChain = getMoonChainNames().has(name);
  const state = useStore.getState();

  if (!state.actualPlanetSizes) {
    const scale = isMoonChain ? (state.moonDisplayOrbitScale ?? 39.2078) : info?.scale;
    if (scale) {
      const anchorName = isMoonChain ? "Earth" : info?.anchorName;
      if (!anchorName) {
        console.warn(`physicalPosition: no unscaled anchor defined for "${name}"`);
        return null;
      }
      const anchorEntry = plotObjects.find((item) => item.name === anchorName);
      const anchor = anchorEntry?.pivotRef?.current;
      if (!anchor) {
        console.warn(`physicalPosition: missing plot anchor "${anchorName}" for "${name}"`);
        return null;
      }
      const anchorPosition = new Vector3();
      anchor.getWorldPosition(anchorPosition);
      out
        .sub(anchorPosition)
        .multiplyScalar(1 / scale)
        .add(anchorPosition);
    }
  }
  return out;
}