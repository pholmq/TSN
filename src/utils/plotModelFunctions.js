import { Vector3, Spherical } from "three";
import { radToRa, radToDec } from "./celestial-functions";
import { getPhysicalPositionFromPlotObjects } from "./physicalPosition";

// Helper to convert degrees to radians
const D2R = Math.PI / 180;

export function movePlotModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    if (pObj.orbitRef && pObj.orbitRef.current) {
      pObj.orbitRef.current.rotation.y =
        pObj.speed * plotPos - pObj.startPos * D2R;
    }
  });
  plotObjects
    .filter((pObj) => typeof pObj.updateAfterMotion === "function")
    .sort((a, b) => (a.updatePriority ?? 0) - (b.updatePriority ?? 0))
    .forEach((pObj) => pObj.updateAfterMotion(plotPos));
}

export function getPlotModelRaDecDistance(name, plotObjects) {
  return getPlotRaDecDistanceFromPosition(name, plotObjects);
}

export function getPlotRaDecDistanceFromPosition(targetName, plotObjects) {
  const earthObj = plotObjects.find((p) => p.name === "Earth");
  const sunObj = plotObjects.find((p) => p.name === "Sun");
  const targetObj = plotObjects.find((p) => p.name === targetName);

  if (!earthObj || !sunObj || !targetObj) return null;

  // Use physical positions for measurements. For the Moon this reverses the
  // display-only orbit scale around Earth; plot traces still keep visual scale.
  const sunPos = new Vector3();
  const earthPos = new Vector3();
  const targetPos = getPhysicalPositionFromPlotObjects(
    targetName,
    plotObjects,
    new Vector3()
  );

  if (!targetPos) return null;
  if (sunObj.pivotRef?.current)
    sunObj.pivotRef.current.getWorldPosition(sunPos);
  if (earthObj.pivotRef?.current)
    earthObj.pivotRef.current.getWorldPosition(earthPos);

  // Transform the target's World Position into Earth's tilted equatorial frame.
  const localVec = targetPos.clone();
  if (earthObj.cSphereRef?.current) {
    earthObj.cSphereRef.current.worldToLocal(localVec);
  }

  // Convert Local Vector to Spherical Coordinates (RA/Dec).
  const sphericalPos = new Spherical().setFromVector3(localVec);
  const ra = radToRa(sphericalPos.theta);
  const dec = radToDec(sphericalPos.phi);
  const radius = sphericalPos.radius / 100;

  // Calculate distances for elongation using the physical target position.
  const earthSunDist = earthPos.distanceTo(sunPos);
  const sunTargetDist = sunPos.distanceTo(targetPos);
  const earthTargetDist = earthPos.distanceTo(targetPos);

  const numerator =
    earthSunDist * earthSunDist +
    earthTargetDist * earthTargetDist -
    sunTargetDist * sunTargetDist;
  const denominator = 2.0 * earthSunDist * earthTargetDist;
  const cosElong = Math.min(Math.max(numerator / denominator, -1), 1);
  const elongationRadians = Math.acos(cosElong);

  let elongation = ((180.0 * elongationRadians) / Math.PI).toFixed(3);
  elongation = isNaN(elongation) ? "-" : `${elongation}\u00B0`;

  let distanceDisplay = `${radius.toFixed(2)} AU`;
  if (radius < 0.01) {
    distanceDisplay = `${(radius * 149597871).toFixed(0)} km`;
  } else if (radius > 10000) {
    distanceDisplay = `${(radius * 0.0000158125).toFixed(3)} ly`;
  }

  return {
    ra,
    dec,
    elongation,
    dist: distanceDisplay,
  };
}
