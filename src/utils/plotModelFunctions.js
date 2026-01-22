import { Vector3, Spherical } from "three";

export function movePlotModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}

export function getRaDecDistancePlotModel(name, scene) {
  const objectPos = new Vector3();
  let targetObject;

  if (name === "Moon") {
    targetObject = scene.getObjectByName("Actual Moon");
  } else {
    targetObject = scene.getObjectByName(name);
  }

  targetObject.getWorldPosition(objectPos);

  return getRaDecDistanceFromPosition(objectPos, scene);
}

export function getRaDecDistanceFromPosition(position, scene) {
  // Reuse vectors and objects to avoid allocations
  const csPos = new Vector3();
  const sunPos = new Vector3();
  const sphericalPos = new Spherical();
  const lookAtDir = new Vector3(0, 0, 1);

  // Update the scene's matrix world once
  scene.updateMatrixWorld();

  // Get world positions for celestial sphere and sun
  const celestialSphere = scene.getObjectByName("CelestialSphere");
  const sun = scene.getObjectByName("Sun");
  const csLookAtObj = scene.getObjectByName("CSLookAtObj");

  if (!celestialSphere || !sun || !csLookAtObj) {
    throw new Error("Required objects not found in the scene.");
  }

  celestialSphere.getWorldPosition(csPos);
  sun.getWorldPosition(sunPos);

  // Calculate RA and Dec
  csLookAtObj.lookAt(position);
  lookAtDir.applyQuaternion(csLookAtObj.quaternion);
  lookAtDir.setLength(csPos.distanceTo(position));
  sphericalPos.setFromVector3(lookAtDir);

  const ra = radToRa(sphericalPos.theta);
  const dec = radToDec(sphericalPos.phi);

  // Calculate distance
  const radius = sphericalPos.radius / 100;
  const distAU = radius.toFixed(2);

  // Calculate elongation
  const earthSunDistance = csPos.distanceTo(sunPos);
  const earthTargetPositionDistance = csPos.distanceTo(position);
  const sunTargetPositionDistance = sunPos.distanceTo(position);

  const numerator =
    earthSunDistance * earthSunDistance +
    earthTargetPositionDistance * earthTargetPositionDistance -
    sunTargetPositionDistance * sunTargetPositionDistance;
  const denominator = 2.0 * earthSunDistance * earthTargetPositionDistance;

  const elongationRadians = Math.acos(numerator / denominator);
  let elongation = ((180.0 * elongationRadians) / Math.PI).toFixed(3);
  elongation =
    isNaN(elongation) || Number(elongation) === 0 ? "-" : `${elongation}\u00B0`;

  let distance = `${distAU} AU`;
  if (distAU > 10000) {
    distance = `${(distAU * 0.0000158125).toFixed(3)} ly`;
  }
  if (distAU < 0.01) {
    distance = `${(radius * 149597871).toFixed(0)} km`;
  }

  return {
    ra,
    dec,
    elongation,
    dist: distance,
  };
}
