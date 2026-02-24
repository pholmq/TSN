import { useStore, useSettingsStore } from "../../store";
import { Html } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import starsData from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
import { getRaDecDistanceFromPosition } from "../../utils/celestial-functions";

const CROSSHAIR_SIZE = 40; // px

export default function HighlightSelectedStar() {
  const { scene } = useThree();
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const selectedStarPosition = useStore((s) => s.selectedStarPosition);
  const showLabels = useStore((s) => s.showLabels);
  const setSelectedStarData = useStore((s) => s.setSelectedStarData);

  const planetSettings = useSettingsStore((s) => s.settings);

  const groupRef = useRef();
  const targetObjectRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const specialStarDef = useMemo(() => {
    if (!selectedStarHR) return null;

    if (selectedStarHR.startsWith("Special:")) {
      const name = selectedStarHR.replace("Special:", "");
      return specialStarsData.find((s) => s.name === name);
    }

    if (selectedStarHR.startsWith("Planet:")) return null;

    return specialStarsData.find(
      (s) => s.HR && String(s.HR) === String(selectedStarHR)
    );
  }, [selectedStarHR]);

  const starName = useMemo(() => {
    if (!selectedStarHR) return null;

    if (selectedStarHR.startsWith("Planet:")) {
      return selectedStarHR.replace("Planet:", "");
    }

    // Force lookup in BSC data to guarantee the 'Name / HIP' formatting, even for Special Stars
    let targetHR = selectedStarHR;
    if (specialStarDef && specialStarDef.HR) {
      targetHR = String(specialStarDef.HR);
    } else if (selectedStarHR.startsWith("Special:")) {
      return specialStarDef ? specialStarDef.name : "Unknown";
    }

    const bscStar = starsData.find(
      (s) => s.HR && String(s.HR) === String(targetHR)
    );
    if (bscStar) {
      const n = specialStarDef?.name || bscStar.N;
      if (n && bscStar.HIP) return `${n} / HIP ${bscStar.HIP}`;
      if (n && bscStar.HR) return `${n} / HR ${bscStar.HR}`;
      if (n) return n;
      if (bscStar.HIP) return `HIP ${bscStar.HIP}`;
      return `HR ${bscStar.HR}`;
    }

    if (specialStarDef) return specialStarDef.name;
    return "Unknown";
  }, [selectedStarHR, specialStarDef]);

  useEffect(() => {
    targetObjectRef.current = null;
    if (!selectedStarHR) return;

    let objName = null;

    if (selectedStarHR.startsWith("Planet:")) {
      objName = selectedStarHR.replace("Planet:", "");
    } else if (specialStarDef) {
      objName = specialStarDef.name;
    }

    if (objName) {
      const obj = scene.getObjectByName(objName);
      if (obj) targetObjectRef.current = obj;
    }
  }, [selectedStarHR, specialStarDef, scene]);

  useEffect(() => {
    if (!selectedStarHR) {
      setSelectedStarData(null);
    }
  }, [selectedStarHR, setSelectedStarData]);

  useFrame(() => {
    if (!selectedStarHR || !groupRef.current) return;

    if (targetObjectRef.current) {
      targetObjectRef.current.getWorldPosition(groupRef.current.position);
    } else if (selectedStarPosition) {
      groupRef.current.position.copy(selectedStarPosition);
    }

    const now = performance.now();
    if (now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;

      const currentPos = groupRef.current.position;
      let magnitude = "N/A";

      if (specialStarDef) {
        magnitude = specialStarDef.magnitude || specialStarDef.V;
      } else {
        const star = starsData.find(
          (s) => String(s.HR) === String(selectedStarHR)
        );
        if (star) magnitude = star.V;
      }

      const { ra, dec, dist, elongation } = getRaDecDistanceFromPosition(
        currentPos,
        scene
      );

      setSelectedStarData({
        ra,
        dec,
        dist,
        elongation,
        mag: magnitude,
      });
    }
  });

  // Only hide the search text for planets (if global labels are ON) since planets manage their own 3D labels
  const isPlanet = selectedStarHR?.startsWith("Planet:");
  const pName = isPlanet ? selectedStarHR.replace("Planet:", "") : null;
  const pSetting = planetSettings.find((s) => s.name === pName);
  const isPlanetVisible = pSetting ? pSetting.visible : true;

  const hideText = isPlanet && showLabels && isPlanetVisible;

  if (!selectedStarHR) return null;

  return (
    <group ref={groupRef}>
      <Html
        position={[0, 0, 0]}
        portal={{ current: document.body }}
        style={{ pointerEvents: "none" }}
        zIndexRange={[10, 0]}
      >
        <div
          style={{
            width: `${CROSSHAIR_SIZE}px`,
            height: `${CROSSHAIR_SIZE}px`,
            position: "absolute",
            top: "0",
            left: "0",
            transform: "translate(-50%, -50%)",
          }}
        >
          {starName && !hideText && (
            <div
              className="name-label"
              style={{
                position: "absolute",
                top: "-5px",
                left: "50%",
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
                color: "white",
                textShadow: "0 0 4px black",
                fontSize: "12px",
              }}
            >
              <span>{starName}</span>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              width: "4px",
              height: "30%",
              background: "yellow",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              height: "4px",
              width: "30%",
              background: "yellow",
              transform: "translateY(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              height: "4px",
              width: "30%",
              background: "yellow",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </Html>
    </group>
  );
}
