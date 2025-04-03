import { Vector3, Spherical, Scene } from "three";

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
  //
  //getRaDecDistance optimized by Deepseek AI
  //

  // Reuse vectors and objects to avoid allocations
  const objectPos = new Vector3();
  const csPos = new Vector3();
  const sunPos = new Vector3();
  const sphericalPos = new Spherical();
  const lookAtDir = new Vector3(0, 0, 1);

  // Update the scene's matrix world once
  scene.updateMatrixWorld();

  // Get world positions
  const targetObject = scene.getObjectByName(name);
  const celestialSphere = scene.getObjectByName("CelestialSphere");
  const sun = scene.getObjectByName("Sun");
  const csLookAtObj = scene.getObjectByName("CSLookAtObj");

  if (!targetObject || !celestialSphere || !sun || !csLookAtObj) {
    throw new Error("Required objects not found in the scene.");
  }

  targetObject.getWorldPosition(objectPos);
  celestialSphere.getWorldPosition(csPos);
  sun.getWorldPosition(sunPos);

  // Calculate RA and Dec
  csLookAtObj.lookAt(objectPos);
  lookAtDir.applyQuaternion(csLookAtObj.quaternion);
  lookAtDir.setLength(csPos.distanceTo(objectPos));
  sphericalPos.setFromVector3(lookAtDir);

  const ra = radToRa(sphericalPos.theta);
  const dec = radToDec(sphericalPos.phi);

  // Calculate distance
  const radius = sphericalPos.radius / 100;
  let distKm, distAU;

  if (name === "Moon") {
    distKm = ((radius * 149597871) / 39.2078).toFixed(0);
    distAU = (radius / 39.2078).toFixed(2);
  } else {
    distKm = (radius * 149597871).toFixed(0);
    distAU = radius.toFixed(2);
  }

  // Calculate elongation
  const earthSunDistance = csPos.distanceTo(sunPos);
  const earthTargetPlanetDistance = csPos.distanceTo(objectPos);
  const sunTargetPlanetDistance = sunPos.distanceTo(objectPos);

  const numerator =
    earthSunDistance * earthSunDistance +
    earthTargetPlanetDistance * earthTargetPlanetDistance -
    sunTargetPlanetDistance * sunTargetPlanetDistance;
  const denominator = 2.0 * earthSunDistance * earthTargetPlanetDistance;

  const elongationRadians = Math.acos(numerator / denominator);
  const elongation = ((180.0 * elongationRadians) / Math.PI).toFixed(2);

  return {
    ra,
    dec,
    elongation,
    dist: distAU < 0.01 ? `${distKm} km` : `${distAU} AU`,
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

export function rad2lat(rad) {
  // Convert radians to degrees
  let deg = (rad * 180) / Math.PI;
  // Normalize to -180 to 180 range
  deg = deg % 360;
  // Adjust for latitude range (-90 to 90)
  if (deg > 90) {
    deg = 180 - deg;
  } else if (deg < -90) {
    deg = -180 - deg;
  }
  // Round to 6 decimal places
  return Math.round(deg * 1000000) / 1000000;
}

export function lat2rad(lat) {
  // Ensure input latitude is within -90 to 90 range
  let normalizedLat = lat;
  normalizedLat = normalizedLat % 360; // Normalize to 0-360 range first
  if (normalizedLat > 90) {
    normalizedLat = 180 - normalizedLat;
  } else if (normalizedLat < -90) {
    normalizedLat = -180 - normalizedLat;
  }

  // Convert degrees to radians
  let rad = (normalizedLat * Math.PI) / 180;

  // Round to 6 decimal places to match rad2lat precision
  return Math.round(rad * 1000000) / 1000000;
}

export function rad2lon(rad) {
  let deg = (rad * 180) / Math.PI;
  deg = deg % 360;
  if (deg > 180) {
    deg -= 360;
  } else if (deg < -180) {
    deg += 360;
  }
  return Math.round(deg * 1000000) / 1000000;
}

export function radiansToAzimuth(radians) {
  // Convert radians to degrees
  let degrees = radians * (180 / Math.PI);
  // Adjust to azimuth convention
  let azimuth = (degrees - 90) % 360;
  // Ensure the result is positive
  if (azimuth < 0) {
    azimuth += 360;
  }
  // Round to two decimal places
  return Math.round(azimuth * 100) / 100;
}

function leadZero(n, plus) {
  let sign = n < 0 ? "-" : "";
  if (sign === "" && plus) {
    sign = "+";
  }
  n = Math.abs(n);
  return n > 9 ? sign + n : sign + "0" + n;
}
