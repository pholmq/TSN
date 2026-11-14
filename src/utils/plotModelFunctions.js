import { Vector3, Spherical } from "three";
import {
  latToRad,
  longToRad,
  radToRa,
  radToDec,
} from "./celestial-functions";
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

export function getPlotModelRaDecDistance(name, plotObjects, observer = null) {
  return getPlotRaDecDistanceFromPosition(name, plotObjects, observer);
}

export function getPlotRaDecDistanceFromPosition(
  targetName,
  plotObjects,
  observer = null
) {
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
  const observerWorld = new Vector3();
  let isTopocentric = false;
  if (earthObj.cSphereRef?.current) {
    const earthFrame = earthObj.cSphereRef.current;
    earthFrame.worldToLocal(localVec);
    if (observer?.radius && Number.isFinite(observer.time)) {
      const observerLocal = new Vector3(0, Number(observer.radius), 0)
        .applyAxisAngle(new Vector3(1, 0, 0), latToRad(observer.latitude))
        .applyAxisAngle(new Vector3(0, 1, 0), longToRad(observer.longitude))
        .applyAxisAngle(
          new Vector3(0, 1, 0),
          Number(observer.rotationStart || 0) +
            Number(observer.rotationSpeed || 0) * Number(observer.time)
        );
      localVec.sub(observerLocal);
      observerWorld.copy(observerLocal);
      earthFrame.localToWorld(observerWorld);
      isTopocentric = true;
    }
  }

  // Convert Local Vector to Spherical Coordinates (RA/Dec).
  const sphericalPos = new Spherical().setFromVector3(localVec);
  const ra = radToRa(sphericalPos.theta);
  const dec = radToDec(sphericalPos.phi);
  const radius = sphericalPos.radius / 100;

  // Calculate distances for elongation using the physical target position.
  const observationOrigin = isTopocentric ? observerWorld : earthPos;
  const earthSunDist = observationOrigin.distanceTo(sunPos);
  const sunTargetDist = sunPos.distanceTo(targetPos);
  const earthTargetDist = observationOrigin.distanceTo(targetPos);

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
