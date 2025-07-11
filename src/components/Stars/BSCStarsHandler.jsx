// components/Stars/BSCStarsHandler.js
import { useThree } from "@react-three/fiber";
import BSCStars from "./BSCStars";
import { useStarDataStore } from "../starDataPanel/starDataStore";
import { getRaDecDistanceFromPosition } from "../../utils/celestial-functions";

export default function BSCStarsHandler() {
  const { scene } = useThree();
  const setHoveredStar = useStarDataStore((state) => state.setHoveredStar);
  const clearHoveredStar = useStarDataStore((state) => state.clearHoveredStar);

  return (
    <BSCStars
      onStarHover={(data, event) => {
        if (data) {
          // console.log(data.position);
          // console.log(getRaDecDistanceFromPosition(data.position, scene));
          const raDec = getRaDecDistanceFromPosition(data.position, scene);
          const star = {};
          star.name = data.star.name;
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
      }}
    />
  );
}
