import { Vector3 } from "three";
import { latToRad, longToRad } from "../../utils/celestial-functions";

// Returns the observer offset in the rotating planet's local frame.
// Radius is expressed in Tychosium scene units and time in simulation years.
export function getObserverLocalPosition({
  latitude,
  longitude,
  radius,
  time,
  rotationStart,
  rotationSpeed,
  target = new Vector3(),
}) {
  target.set(0, radius, 0);
  target.applyAxisAngle(new Vector3(1, 0, 0), latToRad(latitude));
  target.applyAxisAngle(new Vector3(0, 1, 0), longToRad(longitude));
  target.applyAxisAngle(
    new Vector3(0, 1, 0),
    Number(rotationStart || 0) + Number(rotationSpeed || 0) * time
  );
  return target;
}

export function formatGlobalPosition(position) {
  const format = (value) =>
    Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `X ${format(position.x)} | Y ${format(position.y)} | Z ${format(
    position.z
  )} km`;
}
