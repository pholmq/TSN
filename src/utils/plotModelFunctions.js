import { Vector3, Spherical, Object3D } from "three";
// Make sure these are imported correctly from your utils
import { radToRa, radToDec } from "../utils/celestial-functions";

export function movePlotModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    // Check if ref exists before accessing
    if (pObj.orbitRef && pObj.orbitRef.current) {
      pObj.orbitRef.current.rotation.y =
        pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
    }
  });
}

export function getPlotModelRaDecDistance(name, plotObjects) {
  // 1. Handle Name Aliasing (Moon -> Actual Moon)
  // We just determine the correct NAME here, then pass it on.
  let targetName = name;
  if (name === "Moon") {
    // Check if "Actual Moon" exists in the plotObjects, otherwise fallback to "Moon"
    const hasActualMoon = plotObjects.some((p) => p.name === "Actual Moon");
    if (hasActualMoon) {
      targetName = "Actual Moon";
    }
  }

  // 2. Call the calculator with the Name
  return getPlotRaDecDistanceFromPosition(targetName, plotObjects);
}

export function getPlotRaDecDistanceFromPosition(targetName, plotObjects) {
  // 1. Find Earth and Sun
  const earthObj = plotObjects.find((p) => p.name === "Earth");
  const sunObj = plotObjects.find((p) => p.name === "Sun");

  // 2. Find Target
  const targetObj = plotObjects.find((p) => p.name === targetName);

  if (!earthObj || !sunObj || !targetObj) {
    // console.warn(`Plot objects missing. Earth: ${!!earthObj}, Sun: ${!!sunObj}, Target (${targetName}): ${!!targetObj}`);
    return null;
  }

  // 3. Get World Positions using the REFS
  const earthPos = new Vector3();
  const sunPos = new Vector3();
  const targetPos = new Vector3();

  // Validate refs before accessing .current.getWorldPosition
  if (earthObj.pivotRef?.current)
    earthObj.pivotRef.current.getWorldPosition(earthPos);
  if (sunObj.pivotRef?.current)
    sunObj.pivotRef.current.getWorldPosition(sunPos);
  if (targetObj.pivotRef?.current)
    targetObj.pivotRef.current.getWorldPosition(targetPos);

  // 4. Create "Virtual" LookAt Object (Replaces CSLookAtObj)
  // We create a temporary 3D object in memory to handle the quaternion math
  const virtualLookAt = new Object3D();
  virtualLookAt.position.copy(earthPos); // Place observer at Earth
  virtualLookAt.lookAt(targetPos); // Look at Target

  // 5. Perform the Math
  const lookAtDir = new Vector3(0, 0, 1);
  const sphericalPos = new Spherical();

  // Apply rotation
  lookAtDir.applyQuaternion(virtualLookAt.quaternion);

  // Set length to distance between Earth and Target
  const distToTarget = earthPos.distanceTo(targetPos);
  lookAtDir.setLength(distToTarget);

  // Convert to Spherical
  sphericalPos.setFromVector3(lookAtDir);

  const ra = radToRa(sphericalPos.theta);
  const dec = radToDec(sphericalPos.phi);

  // 6. Calculate Distances & Elongation
  // (Scale: 100 units = 1 AU)
  const radius = sphericalPos.radius / 100;
  const distAU = radius.toFixed(2);

  const earthSunDistance = earthPos.distanceTo(sunPos);
  const sunTargetPositionDistance = sunPos.distanceTo(targetPos);

  // Cosine Rule for Elongation
  const numerator =
    earthSunDistance * earthSunDistance +
    distToTarget * distToTarget -
    sunTargetPositionDistance * sunTargetPositionDistance;
  const denominator = 2.0 * earthSunDistance * distToTarget;

  // Protect against floating point errors going outside [-1, 1] for acos
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
  const elongationRadians = Math.acos(clamp(numerator / denominator, -1, 1));

  let elongation = ((180.0 * elongationRadians) / Math.PI).toFixed(3);
  elongation = isNaN(elongation) ? "-" : `${elongation}\u00B0`;

  // Formatting Distance
  let distanceDisplay = `${distAU} AU`;
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
