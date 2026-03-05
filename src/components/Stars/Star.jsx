import { useRef, useEffect, useMemo, memo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { SpriteMaterial, Vector3, SphereGeometry } from "three";
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
import NameLabel from "../Labels/NameLabelBillboard";

const worldPositionVec = new Vector3();
const sharedSphereGeometry = new SphereGeometry(1, 32, 32);

const Star = memo(function Star({ sData }) {
  const { invalidate } = useThree();
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const hScale = useStore((s) => s.hScale);
  const starScale = useStore((s) => s.starScale);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const setSelectedStarPosition = useStore((s) => s.setSelectedStarPosition);

  const s = sData;

  const meshRef = useRef();
  const groupRef = useRef();

  const color = useMemo(() => {
    if (s.overrideColor) return s.overrideColor;
    return colorTemperature2rgb(s.colorTemp);
  }, [s.colorTemp, s.overrideColor]);

  useEffect(() => {
    if (meshRef.current && !s.isTargetClone) {
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
    }
  }, [s.ra, s.dec, s.distLy, starDistanceModifier, officialStarDistances, hScale, invalidate, s.isTargetClone]);

  useFrame(() => {
    if (s.isTargetClone) return;

    const myID = s.HR ? String(s.HR) : `Special:${s.name}`;

    if (selectedStarHR === myID && groupRef.current) {
      groupRef.current.getWorldPosition(worldPositionVec);
      setSelectedStarPosition(worldPositionVec);
    }
  });

  const spriteMaterial = useMemo(() => {
    const circleTexture = createCircleTexture(color);
    return new SpriteMaterial({
      map: circleTexture,
      transparent: true,
      opacity: 1,
      alphaTest: 0.5,
      sizeAttenuation: false,
    });
  }, [color]);

  const size = useMemo(() => {
    let starsize;
    if (s.magnitude < 1) {
      starsize = 1.2;
    } else if (s.magnitude >= 1 && s.magnitude < 3) {
      starsize = 0.6;
    } else if (s.magnitude >= 3 && s.magnitude < 5) {
      starsize = 0.4;
    } else {
      starsize = 0.2;
    }
    return (starsize / 500) * starScale;
  }, [s.magnitude, starScale]);

  if (s.BSCStar && !s.isTargetClone) {
    return null;
  }

  // Globally suppress duplicate labels: If the star is selected in Search, HighlightSelectedStar assumes responsibility
  const myID = s.HR ? String(s.HR) : `Special:${s.name}`;
  const isCurrentlySearched =
    selectedStarHR === myID ||
    (s.isTargetClone && selectedStarHR === String(s.HR));
  const showNameLabel = s.visible && !isCurrentlySearched;

  return (
    <group ref={groupRef} visible={s.visible}>
      {showNameLabel && <NameLabel s={s} />}
      <sprite material={spriteMaterial} scale={[size, size, size]} />
      <mesh name={s.name} ref={meshRef} geometry={sharedSphereGeometry}>
        <FakeGlowMaterial
          glowColor={color}
          falloff={1}
          glowInternalRadius={2}
          glowSharpness={1}
        />
      </mesh>
      {s.visible && !s.isTargetClone && <HoverObj s={s} starColor={color} />}
    </group>
  );
});

export default Star;
