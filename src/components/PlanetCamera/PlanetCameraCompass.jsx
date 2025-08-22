import React, { useRef, useEffect } from "react";
import { useStore } from "../../store";
import "./PlanetCameraCompass.css";

const PlanetCameraCompass = () => {
  const planetCamera = useStore((s) => s.planetCamera);
  const planCamDirection = useStore((s) => s.planCamDirection);
  const compassRef = useRef(null);
  const lastRotationRef = useRef(0);

  useEffect(() => {
    if (!compassRef.current) return;

    const currentDirection = -planCamDirection;
    const lastRotation = lastRotationRef.current;

    // Calculate the difference between current and last rotation
    let rotationDiff = currentDirection - lastRotation;

    // If the difference is greater than 180, we've crossed the 360/0 boundary
    // and should go the shorter way around
    if (rotationDiff > 180) {
      rotationDiff -= 360;
    } else if (rotationDiff < -180) {
      rotationDiff += 360;
    }

    // Calculate the new cumulative rotation
    const newRotation = lastRotation + rotationDiff;
    lastRotationRef.current = newRotation;

    // Apply the rotation
    compassRef.current.style.transform = `rotate(${newRotation}deg)`;
  }, [planCamDirection]);

  if (!planetCamera) return null;

  return (
    <div className="planet-camera-compass">
      <div ref={compassRef} className="compass-rose">
        <div className="compass-direction north">N</div>
        <div className="compass-direction south">S</div>
        <div className="compass-direction east">E</div>
        <div className="compass-direction west">W</div>
      </div>
      <div className="compass-center">{Math.round(planCamDirection)}°</div>
    </div>
  );
};

export default PlanetCameraCompass;
