import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Spherical } from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import starsData from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
import { raDecToAltAz } from "../../utils/celestial-functions";
import { posToDate, posToTime } from "../../utils/time-date-functions";
import TWEEN from "@tweenjs/tween.js";

export default function FocusSearchedStar() {
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const planetCamera = useStore((s) => s.planetCamera);
  const posRef = useStore((s) => s.posRef);
  const tweenRef = useRef(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!selectedStarHR || !planetCamera) return;

    const planetCameraTarget =
      usePlanetCameraStore.getState().planetCameraTarget;

    // Only focus stars/objects when on Earth
    if (planetCameraTarget !== "Earth") return;

    let raHours = null;
    let decDegrees = null;

    // --- 1. Handle Planets ---
    if (selectedStarHR.startsWith("Planet:")) {
      const planetName = selectedStarHR.replace("Planet:", "");
      const targetObj = scene.getObjectByName(planetName);
      const celestialSphere = scene.getObjectByName("CelestialSphere");
      const csLookAtObj = scene.getObjectByName("CSLookAtObj");

      if (targetObj && celestialSphere && csLookAtObj) {
        // Calculate RA/Dec dynamically based on current positions
        const targetPos = new Vector3();
        const csPos = new Vector3();
        targetObj.getWorldPosition(targetPos);
        celestialSphere.getWorldPosition(csPos);

        // Orient the helper to look at the target
        csLookAtObj.lookAt(targetPos);

        // Get direction vector in celestial coordinates
        const lookAtDir = new Vector3(0, 0, 1);
        lookAtDir.applyQuaternion(csLookAtObj.quaternion);

        // Convert to Spherical
        const spherical = new Spherical();
        spherical.setFromVector3(lookAtDir);

        // Convert Spherical to RA (Hours) and Dec (Degrees)
        let rad = spherical.theta;
        if (rad < 0) rad += Math.PI * 2;
        raHours = (rad * 12) / Math.PI;

        // Dec = 90 - (phi * 180 / PI)
        const phiDeg = (spherical.phi * 180) / Math.PI;
        decDegrees = 90 - phiDeg;
      }
    }

    // --- 2. Handle Stars (BSC & Special) ---
    else {
      // Try to find in BSC data first
      // BSC uses uppercase keys: s.RA, s.Dec
      let star = starsData.find((s) => s.HR && String(s.HR) === selectedStarHR);

      if (!star) {
        // Check Special Stars
        // Special stars use lowercase keys: s.ra, s.dec
        if (selectedStarHR.startsWith("Special:")) {
          const name = selectedStarHR.replace("Special:", "");
          star = specialStarsData.find((s) => s.name === name);
        } else {
          // Fallback: Check if special star has this HR
          star = specialStarsData.find(
            (s) => s.HR && String(s.HR) === selectedStarHR
          );
        }
      }

      // Handle both capitalization cases (RA vs ra, Dec vs dec)
      const raRaw = star ? star.RA || star.ra : null;
      const decRaw = star ? star.Dec || star.dec : null;

      if (raRaw && decRaw) {
        // Parse RA (Format: "14h 29m42.9s" or "14h 29m 42.9s")
        const raMatch = raRaw.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);

        // Parse Dec (Format: "-62°40'46.1" or "+04° 41' 34.0″")
        // Regex now handles:
        // 1. Standard symbols: °  ′  ″ (from BSC.json)
        // 2. Typewriter symbols: ' " (from star-settings.json)
        const decMatch = decRaw.match(
          /([+-]?\d+)°\s*(\d+)['′]\s*([\d.]+)(?:["″])?/
        );

        if (raMatch && decMatch) {
          raHours =
            parseInt(raMatch[1]) +
            parseInt(raMatch[2]) / 60 +
            parseFloat(raMatch[3]) / 3600;

          const decSign = decRaw.startsWith("-") ? -1 : 1;
          const degVal = Math.abs(parseInt(decMatch[1]));

          decDegrees =
            decSign *
            (degVal +
              parseInt(decMatch[2]) / 60 +
              parseFloat(decMatch[3]) / 3600);
        }
      }
    }

    // --- 3. Execute Move ---
    if (raHours !== null && decDegrees !== null) {
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

      // Stop any existing tween
      if (tweenRef.current) tweenRef.current.stop();

      tweenRef.current = new TWEEN.Tween(coords)
        .to({ angle: altitude, direction: azimuth }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
          setPlanCamAngle(coords.angle);
          setPlanCamDirection(coords.direction);
        })
        .start();
    }
  }, [selectedStarHR, planetCamera, posRef, scene]);

  useFrame(() => {
    if (tweenRef.current) {
      TWEEN.update();
    }
  });

  if (!planetCamera) return null;
  return null;
}
