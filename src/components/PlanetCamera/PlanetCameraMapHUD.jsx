import React, { useRef, useState } from "react";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

const textureMap = {
  Earth: "/textures/planets/2k_earth_daymap.jpg",
  Moon: "/textures/planets/2k_moon.jpg",
  Mars: "/textures/planets/2k_mars.jpg",
  Mercury: "/textures/planets/2k_mercury.jpg",
  Venus: "/textures/planets/2k_venus.jpg",
  Sun: "/textures/planets/2k_sun.jpg",
  Jupiter: "/textures/planets/2k_jupiter.jpg",
  Saturn: "/textures/planets/2k_saturn.jpg",
  Uranus: "/textures/planets/2k_uranus.jpg",
  Neptune: "/textures/planets/2k_neptune.jpg",
  Pluto: "/textures/planets/2k_pluto.jpg",
};

export default function PlanetCameraMapHUD({ onPositionUpdate }) {
  const planetCamera = useStore((s) => s.planetCamera);
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);
  const lat = usePlanetCameraStore((s) => s.planCamLat);
  const long = usePlanetCameraStore((s) => s.planCamLong);
  const setLat = usePlanetCameraStore((s) => s.setPlanCamLat);
  const setLong = usePlanetCameraStore((s) => s.setPlanCamLong);

  const mapRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!planetCamera) return null;

  const textureUrl = textureMap[target] || textureMap["Earth"];

  const handlePointerEvent = (e) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();

    // Clamp to boundaries
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    // Convert pixel coordinates back to Lat/Long (Equirectangular projection)
    const newLong = Number(((x / rect.width) * 360 - 180).toFixed(2));
    const newLat = Number((90 - (y / rect.height) * 180).toFixed(2));

    if (onPositionUpdate) {
      onPositionUpdate(newLat, newLong);
    } else {
      setLong(newLong);
      setLat(newLat);
    }
  };

  // Normalize longitude for the visual dot just in case it wraps past 180/-180
  let normLong = long % 360;
  if (normLong > 180) normLong -= 360;
  if (normLong < -180) normLong += 360;

  const dotX = ((normLong + 180) / 360) * 100;
  const dotY = ((90 - lat) / 180) * 100;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px", // Reduced from 20px
        left: "10px", // Reduced from 20px
        width: "300px",
        height: "150px",
        border: "2px solid rgba(255, 255, 255, 0.4)",
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "crosshair",
        boxShadow: "0 4px 8px rgba(0,0,0,0.6)",
        zIndex: 1000,
        pointerEvents: "auto",
        backgroundColor: "#000",
      }}
      ref={mapRef}
      onPointerDown={(e) => {
        setIsDragging(true);
        handlePointerEvent(e);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (isDragging) handlePointerEvent(e);
      }}
      onPointerUp={(e) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    >
      <img
        src={textureUrl}
        alt={`${target} Map`}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: `${dotY}%`,
          left: `${dotX}%`,
          width: "10px",
          height: "10px",
          backgroundColor: "#ff0044",
          border: "1px solid white",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          boxShadow: "0 0 4px rgba(0,0,0,0.8)",
        }}
      />
    </div>
  );
}
