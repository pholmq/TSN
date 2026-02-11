import { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { SpriteMaterial, MathUtils, Vector3 } from "three";
import FakeGlowMaterial from "../../utils/FakeGlowMaterial";
import { useStore } from "../../store";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
} from "../../utils/celestial-functions";
import HoverObj from "../HoverObj/HoverObj";
import createCircleTexture from "../../utils/createCircleTexture";
import colorTemperature2rgb from "../../utils/colorTempToRGB";
import NameLabel from "../Labels/NameLabel";

export default function Star({ sData }) {
  const { invalidate } = useThree();
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const hScale = useStore((s) => s.hScale);
  const starScale = useStore((s) => s.starScale);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);

  const s = sData;

  const color = colorTemperature2rgb(s.colorTemp);

  const meshRef = useRef();
  const groupRef = useRef();
  const minScreenSize = 0.1;

  useEffect(() => {
    if (meshRef.current) {
      const raRad = rightAscensionToRadians(s.ra);
      const decRad = declinationToRadians(s.dec);
      let dist;
      if (!officialStarDistances) {
        dist = (20000 * hScale) / 100;
      } else {
        const worldDist = s.distLy * 63241 * 100;
        dist =
          worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1);
      }

      const { x, y, z } = sphericalToCartesian(raRad, decRad, dist);

      groupRef.current.position.set(x, y, z);
      invalidate();
    }
  }, [s, starDistanceModifier, officialStarDistances, hScale]);

  // --- NEW: Report position if selected ---
  useFrame(() => {
    // Ensure ID format matches StarSearch logic
    const myID = s.HR ? String(s.HR) : `Special:${s.name}`;

    if (selectedStarHR === myID && groupRef.current) {
      const vec = new Vector3();
      groupRef.current.getWorldPosition(vec);
      setSelectedStarPosition(vec);
    }
  });

  const circleTexture = createCircleTexture(color);
  const spriteMaterial = new SpriteMaterial({
    map: circleTexture,
    transparent: true,
    opacity: 1,
    alphaTest: 0.5,
    sizeAttenuation: false,
  });

  let starsize;
  if (s.magnitude < 1) {
    starsize = 1.2;
  } else if (s.magnitude > 1 && s.magnitude < 3) {
    starsize = 0.6;
  } else if (s.magnitude > 3 && s.magnitude < 5) {
    starsize = 0.4;
  } else {
    starsize = 0.2;
  }

  const size = (starsize / 500) * starScale;

  if (s.BSCStar) {
    return null;
  }

  return (
    <group ref={groupRef} visible={s.visible}>
      {s.visible && <NameLabel s={s} />}
      <sprite material={spriteMaterial} scale={[size, size, size]} />
      <mesh name={s.name} ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <FakeGlowMaterial
          glowColor={color}
          falloff={1}
          glowInternalRadius={2}
          glowSharpness={1}
        />
      </mesh>
      {s.visible && <HoverObj s={s} starColor={color} />}
    </group>
  );
}
