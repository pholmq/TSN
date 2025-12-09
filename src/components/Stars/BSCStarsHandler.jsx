// src/components/Stars/BSCStarsHandler.jsx (Refactored)
import { useThree } from "@react-three/fiber";
import { useCallback } from "react"; // 👈 New Import
import BSCStars from "./BSCStars";
import { useStarDataStore } from "../StarDataPanel/starDataStore";
import { getRaDecDistanceFromPosition } from "../../utils/celestial-functions";

export default function BSCStarsHandler() {
  const { scene } = useThree();
  const setHoveredStar = useStarDataStore((state) => state.setHoveredStar);
  const clearHoveredStar = useStarDataStore((state) => state.clearHoveredStar);

  // Wrap the event handler in useCallback to ensure prop stability
  const handleStarHover = useCallback((data, event) => {
    if (data) {
      // NOTE: getRaDecDistanceFromPosition is a potential performance bottleneck 
      // if it's a synchronous, complex calculation.
      const raDec = getRaDecDistanceFromPosition(data.position, scene);
      
      const star = {};
      star.name = data.star.name;
      star.HR = data.star.HR;
      star.ra = raDec.ra;
      star.dec = raDec.dec;
      star.dist = raDec.dist;
      star.elongation = raDec.elongation;
      star.magnitude = data.star.magnitude;
      star.colorTemp = data.star.colorTemp;
      setHoveredStar(star);
    } else {
      clearHoveredStar();
    }
  }, [scene, setHoveredStar, clearHoveredStar]);
  // Dependencies: 'scene' (from useThree) and the stable Zustand setters.

  return (
    <BSCStars
      onStarHover={handleStarHover} // 👈 Use the stable function
    />
  );
}