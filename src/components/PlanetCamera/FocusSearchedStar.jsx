import { useEffect } from "react";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import starsData from "../../settings/BSC.json";
import { raDecToAltAz } from "../../utils/celestial-functions";
import {
  posToDate,
  posToTime,
  dateTimeToPos,
} from "../../utils/time-date-functions";

export default function FocusSearchedStar() {
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const planetCamera = useStore((s) => s.planetCamera);
  const posRef = useStore((s) => s.posRef);

  useEffect(() => {
    if (!selectedStarHR || !planetCamera) return;

    // Get star's RA/Dec from BSC.json
    const star = starsData.find((s) => s.HR === selectedStarHR);
    if (!star || !star.RA || !star.Dec) return;

    // Parse RA (hours) and Dec (degrees)
    const raMatch = star.RA.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);
    const decMatch = star.Dec.match(/([+-]?\d+)°\s*(\d+)′\s*([\d.]+)″/);

    if (!raMatch || !decMatch) return;

    const raHours =
      parseInt(raMatch[1]) +
      parseInt(raMatch[2]) / 60 +
      parseFloat(raMatch[3]) / 3600;

    const decSign = star.Dec.startsWith("-") ? -1 : 1;
    const decDegrees =
      decSign *
      (Math.abs(parseInt(decMatch[1])) +
        parseInt(decMatch[2]) / 60 +
        parseFloat(decMatch[3]) / 3600);

    // Get observer position
    const planCamLat = usePlanetCameraStore.getState().planCamLat;
    const planCamLong = usePlanetCameraStore.getState().planCamLong;

    // Get current simulation time
    const currentDate = posToDate(posRef.current);
    const currentTime = posToTime(posRef.current);
    const dateTime = `${currentDate}T${currentTime}Z`;

    // Convert RA/Dec to Alt/Az
    const { altitude, azimuth } = raDecToAltAz(
      raHours,
      decDegrees,
      planCamLat,
      planCamLong,
      dateTime
    );

    console.log("Star:", star.N || star.HR, "Alt:", altitude, "Az:", azimuth);

    // Set camera angles
    const setPlanCamAngle = usePlanetCameraStore.getState().setPlanCamAngle;
    const setPlanCamDirection =
      usePlanetCameraStore.getState().setPlanCamDirection;

    setPlanCamAngle(altitude);
    setPlanCamDirection(azimuth);
  }, [selectedStarHR, planetCamera, posRef]);

  if (!planetCamera) return null;
  return null;
}
