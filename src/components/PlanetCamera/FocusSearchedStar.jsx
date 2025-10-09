import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import starsData from "../../settings/BSC.json";
import { raDecToAltAz } from "../../utils/celestial-functions";
import { posToDate, posToTime } from "../../utils/time-date-functions";
import TWEEN from "@tweenjs/tween.js";

export default function FocusSearchedStar() {
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const planetCamera = useStore((s) => s.planetCamera);
  const posRef = useStore((s) => s.posRef);
  const tweenRef = useRef(null);

  useEffect(() => {
    if (!selectedStarHR || !planetCamera) return;

    const planetCameraTarget =
      usePlanetCameraStore.getState().planetCameraTarget;

    // Only focus stars when on Earth
    if (planetCameraTarget !== "Earth") return;

    const star = starsData.find((s) => s.HR === selectedStarHR);
    if (!star || !star.RA || !star.Dec) return;

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

    const planCamLat = usePlanetCameraStore.getState().planCamLat;
    const planCamLong = usePlanetCameraStore.getState().planCamLong;
    const currentAngle = usePlanetCameraStore.getState().planCamAngle;
    const currentDirection = usePlanetCameraStore.getState().planCamDirection;

    const currentDate = posToDate(posRef.current);
    const currentTime = posToTime(posRef.current);
    const dateTime = `${currentDate}T${currentTime}Z`;

    const { altitude, azimuth } = raDecToAltAz(
      raHours,
      decDegrees,
      planCamLat,
      planCamLong,
      dateTime
    );

    // Tween to target angles
    const coords = { angle: currentAngle, direction: currentDirection };
    const setPlanCamAngle = usePlanetCameraStore.getState().setPlanCamAngle;
    const setPlanCamDirection =
      usePlanetCameraStore.getState().setPlanCamDirection;

    tweenRef.current = new TWEEN.Tween(coords)
      .to({ angle: altitude, direction: azimuth }, 2000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        setPlanCamAngle(coords.angle);
        setPlanCamDirection(coords.direction);
      })
      .start();
  }, [selectedStarHR, planetCamera, posRef]);

  useFrame(() => {
    if (tweenRef.current) {
      TWEEN.update();
    }
  });

  if (!planetCamera) return null;
  return null;
}
