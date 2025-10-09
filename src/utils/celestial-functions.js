import { Vector3, Spherical, Scene } from "three";

// Convert RA/Dec to Altitude/Azimuth for observer at given lat/lon/time
export function raDecToAltAz(ra, dec, lat, lon, time) {
  const toRadians = (deg) => deg * (Math.PI / 180);
  const toDegrees = (rad) => rad * (180 / Math.PI);

  // Convert inputs to radians
  const raRad = toRadians(ra * 15); // RA is in hours, convert to degrees first
  const decRad = toRadians(dec);
  const latRad = toRadians(lat);
  const lonRad = toRadians(lon);

  // Calculate Julian Date
  const date = new Date(time);
  const jd = date.getTime() / 86400000 + 2440587.5;

  // Calculate GMST (Greenwich Mean Sidereal Time)
  const t = (jd - 2451545.0) / 36525;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  gmst = gmst % 360;

  // Calculate LST (Local Sidereal Time)
  let lst = (gmst + toDegrees(lonRad)) % 360;
  const lstRad = toRadians(lst);

  // Calculate Hour Angle
  const ha = lstRad - raRad;

  // Calculate Altitude
  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(sinAlt);

  // Calculate Azimuth
  const cosAz =
    (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) /
    (Math.cos(alt) * Math.cos(latRad));
  let az = Math.acos(cosAz);

  // Adjust azimuth for quadrant
  if (Math.sin(ha) > 0) {
    az = 2 * Math.PI - az;
  }

  return {
    altitude: toDegrees(alt),
    azimuth: toDegrees(az),
  };
}

export function azEl2RaDec(Az, El, lat, lon, time) {
  const date = new Date(time);

  function julianDate(year, month, day, hour, min, sec) {
    const YearDur = 365.25;
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const A = Math.floor(YearDur * (year + 4716));
    const B = Math.floor(30.6001 * (month + 1));
    const C = 2;
    const D = Math.floor(year / 100);
    const E = Math.floor(D * 0.25);
    const F = day - 1524.5;
    const G = (hour + min / 60 + sec / 3600) / 24;
    return A + B + C - D + E + F + G;
  }

  const JD = julianDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  const T_UT1 = (JD - 2451545) / 36525;

  let ThetaGMST =
    67310.54841 +
    (876600 * 3600 + 8640184.812866) * T_UT1 +
    0.093104 * T_UT1 ** 2 -
    6.2e-6 * T_UT1 ** 3;
  ThetaGMST = ((ThetaGMST % (86400 * Math.sign(ThetaGMST))) / 240) % 360;

  const ThetaLST = ThetaGMST + lon;

  const DEC =
    (Math.asin(
      Math.sin((El * Math.PI) / 180) * Math.sin((lat * Math.PI) / 180) +
        Math.cos((El * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.cos((Az * Math.PI) / 180)
    ) *
      180) /
    Math.PI;

  const LHA =
    (Math.atan2(
      (-Math.sin((Az * Math.PI) / 180) * Math.cos((El * Math.PI) / 180)) /
        Math.cos((DEC * Math.PI) / 180),
      (Math.sin((El * Math.PI) / 180) -
        Math.sin((DEC * Math.PI) / 180) * Math.sin((lat * Math.PI) / 180)) /
        (Math.cos((DEC * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180))
    ) *
      180) /
    Math.PI;

  const RA = (((ThetaLST - LHA) % 360) + 360) % 360;

  return [RA, DEC];
}

export function decFromAzAltLat(az, alt, lat) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const toDegrees = (rad) => (rad * 180) / Math.PI;

  const azRad = toRadians(az);
  const altRad = toRadians(alt);
  const latRad = toRadians(lat);

  const sinDec =
    Math.sin(altRad) * Math.sin(latRad) +
    Math.cos(altRad) * Math.cos(latRad) * Math.cos(azRad);

  return toDegrees(Math.asin(sinDec));
}

export function rAandDecFromLocal(lat, lon, time, az, alt) {
  const toRadians = (deg) => deg * (Math.PI / 180);
  const toDegrees = (rad) => rad * (180 / Math.PI);

  lat = toRadians(lat);
  lon = toRadians(lon);
  az = toRadians(az);
  alt = toRadians(alt);

  const date = new Date(time);
  const utc =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  let lst = (gmst + lon * (180 / Math.PI)) % 360;
  lst = toRadians(lst);

  const sinDec =
    Math.sin(lat) * Math.sin(alt) +
    Math.cos(lat) * Math.cos(alt) * Math.cos(az);
  const decRad = Math.asin(sinDec);

  const cosH =
    (Math.sin(alt) - Math.sin(lat) * Math.sin(decRad)) /
    (Math.cos(lat) * Math.cos(decRad));
  let h = Math.acos(cosH);
  if (Math.sin(az) > 0) {
    h = 2 * Math.PI - h;
  }

  let ra = lst - h;
  if (ra < 0) ra += 2 * Math.PI;
  if (ra > 2 * Math.PI) ra -= 2 * Math.PI;

  return { ra: toDegrees(ra) / 15, dec: toDegrees(decRad) };
}

export function getRaDecDistance(name, scene) {
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

export function radToRa(rad) {
  if (rad < 0) rad += Math.PI * 2;
  const raDec = (rad * 12) / Math.PI;
  const hours = Math.floor(raDec);
  const minutes = Math.floor((raDec - hours) * 60);
  const seconds = ((raDec - hours) * 60 - minutes) * 60;
  return `${leadZero(hours)}h${leadZero(minutes)}m${leadZero(
    seconds.toFixed(0)
  )}s`;
}

export function radToDec(rad) {
  rad = rad <= 0 ? rad + Math.PI / 2 : Math.PI / 2 - rad;
  const degDec = (rad * 180) / Math.PI;
  const degrees = Math.floor(Math.abs(degDec));
  const minutes = Math.floor((Math.abs(degDec) - degrees) * 60);
  const seconds = ((Math.abs(degDec) - degrees) * 60 - minutes) * 60;
  return `${degDec < 0 ? "-" : ""}${leadZero(degrees)}°${leadZero(
    minutes
  )}'${leadZero(seconds.toFixed(0))}"`;
}

export function declinationToRadians(declination) {
  const regex = /(-?\d+)[^\d]+(\d*)[^\d]*(\d*)/;
  const match = declination.match(regex);

  if (!match) {
    throw new Error("Invalid declination format");
  }

  let degrees = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  let seconds = match[3] ? parseInt(match[3], 10) : 0;

  if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) {
    throw new Error("Invalid declination format: could not parse numbers");
  }

  if (degrees > 90 || degrees < -90) {
    throw new Error("Degrees must be between -90 and 90");
  }

  // Convert to decimal degrees
  let decimalDegrees = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  decimalDegrees = degrees < 0 ? -decimalDegrees : decimalDegrees;

  // Convert to radians
  return decimalDegrees * (Math.PI / 180);
}

export function rightAscensionToRadians(ra) {
  const regex = /(\d+)[^\d]+(\d*)[^\d]*(\d*)/;
  const match = ra.match(regex);

  if (!match) {
    throw new Error("Invalid right ascension format");
  }

  let hours = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  let seconds = match[3] ? parseInt(match[3], 10) : 0;

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    throw new Error("Invalid right ascension format: could not parse numbers");
  }

  if (hours < 0 || hours >= 24) {
    throw new Error("Hours must be between 0 and 23");
  }

  // Convert to decimal hours
  let decimalHours = hours + minutes / 60 + seconds / 3600;

  // Convert to radians (15 degrees per hour)
  return decimalHours * 15 * (Math.PI / 180);
}

export function sphericalToCartesian(raRad, decRad, dist) {
  const z = dist * Math.cos(decRad) * Math.cos(raRad); // Z is now equatorial plane
  const x = dist * Math.cos(decRad) * Math.sin(raRad); // X now tracks RA rotation
  const y = dist * Math.sin(decRad); // Y determines height (North/South)

  return { x, y, z };
}

export function convertMagnitude(magnitude) {
  // Define the reference magnitude (brightness of the dimmest visible star)
  const referenceMagnitude = 6.5;

  // Calculate the difference from the reference magnitude
  const difference = referenceMagnitude - magnitude;

  // Convert to a positive scale where brighter objects have higher values
  const convertedValue = Math.max(0, Math.pow(10, difference / 2.5));

  // Round to 2 decimal places for readability
  return Math.round(convertedValue * 100) / 100;
}

export function latToRad(degrees) {
  // Shift the input by -90 degrees and scale to match the desired output
  // Normal conversion is (degrees * Math.PI / 180)
  // We want: 90° → 0, 0° → -π/2, -90° → -π
  return (degrees - 90) * (Math.PI / 180);
}

export function radToLat(radians) {
  // Normal conversion is (radians * 180 / Math.PI)
  // We want: 0 → 90°, -π/2 → 0°, -π → -90°
  return radians * (180 / Math.PI) + 90;
}

export function longToRad(degrees) {
  // Normalize the angle to be within -180 to 180 degrees
  let normalized = ((((degrees + 180) % 360) + 360) % 360) - 180;
  // Convert to standard radians where 0° = 0rad, 90° = π/2, etc.
  let standardRadians = normalized * (Math.PI / 180);
  // Shift the result by adding 3π/2 and normalize to 0 to 2π range
  let shiftedRadians = (standardRadians + (3 * Math.PI) / 2) % (2 * Math.PI);
  return shiftedRadians;
}

export function radToLong(radians) {
  // Normalize radians to 0 to 2π
  let normalizedRad = ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // Reverse the shift by subtracting 3π/2 and normalize again
  let unshiftedRad =
    (normalizedRad - (3 * Math.PI) / 2 + 2 * Math.PI) % (2 * Math.PI);
  // Convert to degrees and adjust to -180 to 180 range
  let degrees = unshiftedRad * (180 / Math.PI);
  if (degrees > 180) {
    degrees -= 360;
  }
  return degrees;
}

export function kmToUnits(kilometers) {
  const units = kilometers / 1495978.707;
  //Kilometers is divided by this since 100 units in the model is 1 AU
  return units;
}

export function unitsToKm(units) {
  const kilometers = units * 1495978.707;
  //Units is multiplied by this since 100 units in the model is 1 AU
  return kilometers;
}

export function lyToUnits(lightYears) {
  return lightYears * 6324100;
}

export function altToRad(degrees) {
  return degrees * (Math.PI / 180);
}

export function dirToRad(degrees) {
  // Correct for 12-degree offset between compass and celestial coordinates
  // This aligns the planet camera's azimuth with true astronomical directions
  // const astronomicalAzimuth = (degrees + 12) % 360;
  const astronomicalAzimuth = degrees % 360;
  return Math.PI - (Math.PI / 180) * astronomicalAzimuth;
}

function leadZero(n, plus) {
  let sign = n < 0 ? "-" : "";
  if (sign === "" && plus) {
    sign = "+";
  }
  n = Math.abs(n);
  return n > 9 ? sign + n : sign + "0" + n;
}
