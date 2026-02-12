import { useStore } from "../../store";
import { Html } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import starsData from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
import { LABELED_STARS } from "../Stars/LabeledStars";
import { getRaDecDistanceFromPosition } from "../../utils/celestial-functions";

const CROSSHAIR_SIZE = 40; // px

export default function HighlightSelectedStar() {
  const { scene } = useThree();
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const selectedStarPosition = useStore((s) => s.selectedStarPosition);
  const showLabels = useStore((s) => s.showLabels);
  const setSelectedStarData = useStore((s) => s.setSelectedStarData);

  const groupRef = useRef();
  const targetObjectRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // --- 1. Identify Special Star Data ---
  const specialStarDef = useMemo(() => {
    if (!selectedStarHR) return null;

    // Check for "Special:" prefix (Correct format for non-BSC stars)
    if (selectedStarHR.startsWith("Special:")) {
      const name = selectedStarHR.replace("Special:", "");
      return specialStarsData.find((s) => s.name === name);
    }

    if (selectedStarHR.startsWith("Planet:")) return null;

    // Check by HR if applicable
    return specialStarsData.find(
      (s) => s.HR && String(s.HR) === String(selectedStarHR)
    );
  }, [selectedStarHR]);

  // --- 2. Determine Display Name ---
  const starName = useMemo(() => {
    if (!selectedStarHR) return null;

    if (selectedStarHR.startsWith("Planet:")) {
      return selectedStarHR.replace("Planet:", "");
    }

    if (specialStarDef) {
      return specialStarDef.name;
    }

    const star = starsData.find((s) => s.HR && String(s.HR) === selectedStarHR);
    if (star) {
      if (star.N && star.HIP) return `${star.N} / HIP ${star.HIP}`;
      if (star.N && star.HR) return `${star.N} / HR ${star.HR}`;
      if (star.N) return star.N;
      if (star.HIP) return `HIP ${star.HIP}`;
      if (star.HR) return `HR ${star.HR}`;
    }

    return "Unknown";
  }, [selectedStarHR, specialStarDef]);

  // --- 3. Identify Target Object in Scene ---
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

  // --- 4. Cleanup ---
  useEffect(() => {
    if (!selectedStarHR) {
      setSelectedStarData(null);
    }
  }, [selectedStarHR, setSelectedStarData]);

  // --- 5. Render Loop ---
  useFrame(() => {
    if (!selectedStarHR || !groupRef.current) return;

    // Position Update
    if (targetObjectRef.current) {
      targetObjectRef.current.getWorldPosition(groupRef.current.position);
    } else if (selectedStarPosition) {
      groupRef.current.position.copy(selectedStarPosition);
    }

    // Data Update (Throttled)
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

  // --- 6. FIX: Correctly Identify if Star is Already Labeled ---
  const isLabeledStar = useMemo(() => {
    if (!selectedStarHR) return false;

    // A. Planets are always treated as labeled
    if (selectedStarHR.startsWith("Planet:")) return true;

    // B. Special Stars: We assume Special Stars (defined in star-settings) ALWAYS have their own label
    //    via Star.jsx, so we return TRUE to suppress the duplicate selection label.
    if (specialStarDef) return true;

    // C. BSC Stars: Check against the LABELED_STARS list
    const star = starsData.find((s) => s.HR && String(s.HR) === selectedStarHR);
    if (!star) return false;

    return LABELED_STARS.some(
      (query) =>
        (star.N && star.N.toLowerCase() === query.toLowerCase()) ||
        star.HIP === query ||
        star.HR === query
    );
  }, [selectedStarHR, specialStarDef]);

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
          {/* Only show the Selection Label if the star is NOT already labeled in the scene */}
          {starName && !(showLabels && isLabeledStar) && (
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
