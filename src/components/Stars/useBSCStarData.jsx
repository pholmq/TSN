import { useMemo } from "react";
import { useStore } from "../../store";
import bscSettings from "../../settings/BSC.json";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import colorTemperature2rgb from "../../utils/colorTempToRGB";

// 1. Accept an optional argument (default is false so other components work as normal)
export const useBSCStarData = (forceProjected = false) => {
  // 2. Get the real setting from the store
  const officialStarDistancesSetting = useStore((s) => s.officialStarDistances);
  
  // 3. Determine the effective value to use for calculation
  // If forceProjected is true, we treat officialStarDistances as false (Sphere view)
  const officialStarDistances = forceProjected ? false : officialStarDistancesSetting;

  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const hScale = useStore((s) => s.hScale);
  const starScale = useStore((s) => s.starScale);
  const starPickingSensitivity = useStore((s) => s.starPickingSensitivity);

  const { positions, colors, sizes, pickingSizes, starData, pickingColors, colorMap } =
    useMemo(() => {
      const positions = [];
      const colors = [];
      const pickingColors = [];
      const sizes = [];
      const pickingSizes = [];
      const starData = [];
      const colorMap = new Map();

      bscSettings.forEach((s, index) => {
        const magnitude = parseFloat(s.V);
        const colorTemp = parseFloat(s.K) || 5778;

        const raRad = rightAscensionToRadians(s.RA);
        const decRad = declinationToRadians(s.Dec);

        const distLy = parseFloat(s.P) * 3.26156378;
        let dist;
        
        // 4. This logic now uses our local 'officialStarDistances' variable
        if (!officialStarDistances) {
          dist = (20000 * hScale) / 100;
        } else {
          const worldDist = distLy * 63241 * 100;
          dist =
            worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1);
        }

        const { x, y, z } = sphericalToCartesian(raRad, decRad, dist);
        positions.push(x, y, z);

        const { red, green, blue } = colorTemperature2rgb(colorTemp, true);
        colors.push(red, green, blue);

        const colorIndex = index + 1;
        const r = (colorIndex & 0xff) / 255;
        const g = ((colorIndex >> 8) & 0xff) / 255;
        const b = ((colorIndex >> 16) & 0xff) / 255;

        pickingColors.push(r, g, b);

        const rInt = Math.round(r * 255);
        const gInt = Math.round(g * 255);
        const bInt = Math.round(b * 255);
        const hexColor = (rInt << 16) | (gInt << 8) | bInt;

        colorMap.set(hexColor, index);

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

        let pickingSize;
        if (magnitude >= 3) {
          pickingSize = visualSize * starPickingSensitivity;
        } else {
          pickingSize = visualSize;
        }

        sizes.push(visualSize);
        pickingSizes.push(pickingSize);

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
        pickingColors: new Float32Array(pickingColors),
        sizes: new Float32Array(sizes),
        pickingSizes: new Float32Array(pickingSizes),
        starData,
        colorMap,
      };
    }, [
      officialStarDistances, // This dependency now tracks our local overridden variable
      hScale,
      starDistanceModifier,
      starScale,
      starPickingSensitivity,
    ]);

  return { positions, colors, sizes, pickingSizes, starData, pickingColors, colorMap };
};