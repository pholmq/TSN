// src/components/Stars/useBSCStarData.jsx
import { useMemo } from "react";
import { useStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import colorTemperature2rgb from "../../utils/colorTempToRGB";

export const useBSCStarData = (forceProjected = false) => {
  const officialStarDistancesSetting = useStore((s) => s.officialStarDistances);
  const officialStarDistances = forceProjected ? false : officialStarDistancesSetting;

  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const hScale = useStore((s) => s.hScale);
  const starScale = useStore((s) => s.starScale);

  // Notice: Removed starPickingSensitivity

  const { positions, colors, sizes, starData } =
    useMemo(() => {
      const positions = [];
      const colors = [];
      const sizes = [];
      const starData = [];

      bscSettings.forEach((s, index) => {
        const magnitude = parseFloat(s.V);
        const colorTemp = parseFloat(s.K) || 5778;

        const raRad = rightAscensionToRadians(s.RA);
        const decRad = declinationToRadians(s.Dec);

        const distLy = parseFloat(s.P) * 3.26156378;
        let dist;
        
        if (!officialStarDistances) {
          dist = (20000 * hScale) / 100;
        } else {
          const worldDist = distLy * 63241 * 100;
          dist = worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1);
        }

        const { x, y, z } = sphericalToCartesian(raRad, decRad, dist);
        positions.push(x, y, z);

        const { red, green, blue } = colorTemperature2rgb(colorTemp, true);
        colors.push(red, green, blue);

        // --- Removed all pickingColor and colorMap bitwise logic ---

        let starsize;
        if (magnitude < 1) {
            starsize = 1.2;
        } else if (magnitude > 1 && magnitude < 3) {
            starsize = 0.6;
        } else if (magnitude > 3 && magnitude < 5) {
            starsize = 0.4;
        } else {
            starsize = 0.2;
        }

        const visualSize = starsize * starScale * 10;
        sizes.push(visualSize);

        // --- Removed pickingSizes logic ---

        starData.push({
          name: (() => {
            if (s.N && s.HIP) {
              return `${s.N} / HIP ${s.HIP}`;
            } else if (s.HIP) {
              return `HIP ${s.HIP}`;
            } else if (s.HR) {
              return `HR ${s.HR}`;
            }
            return "Unknown";
          })(),
          HR: s.HR,
          magnitude: isNaN(magnitude) ? 5 : magnitude,
          colorTemp,
          ra: s.RA,
          dec: s.Dec,
          distLy,
          index: index,
        });
      });

      return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        sizes: new Float32Array(sizes),
        starData,
      };
    }, [
      officialStarDistances, 
      hScale,
      starDistanceModifier,
      starScale,
    ]);

  return { positions, colors, sizes, starData };
};