import { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { SpriteMaterial, MathUtils, Vector3 } from "three";
import FakeGlowMaterial from "../../utils/FakeGlowMaterial";
import { useStore, useStarStore } from "../../store";
import {
  declinationToRadians,
  rightAscensionToRadians,
  sphericalToCartesian,
  convertMagnitude,
} from "../../utils/celestial-functions";
import HoverObj from "../HoverObj/HoverObj";
import createCircleTexture from "../../utils/createCircleTexture";
import colorTemperature2rgb from "../../utils/colorTempToRGB";
import NameLabel from "../Labels/NameLabel";

export default function Star({ name, bscStar = false, bscStarData = null }) {
  const { camera, invalidate } = useThree();
  const { settings } = useStarStore();
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const starScale = useStore((s) => s.starScale);
  let s = {};
  if (bscStar) {
    // console.log("BSCStar " + JSON.stringify(bscStarData, null, 2));
    if (!bscStarData.name.length) {
      //No common name, use HIP number
      s.name = bscStarData.hip
    } else {
      s.name = bscStarData.name[0]
    }
    return null;
  } else { //if bscStar
    s = settings.find((obj) => obj.name === name);
  }

  const radius = s.size;
  // const color = s.color;
  const color = colorTemperature2rgb(s.colorTemp);

  const meshRef = useRef();
  const groupRef = useRef();
  const minScreenSize = 0.1;

  const prevCameraPos = useRef(new Vector3());
  const prevFov = useRef(null);

  const updateScale = (camera) => {
    if (!meshRef.current) return;
    const distance = camera.position.distanceTo(meshRef.current.position);
    const fov = MathUtils.degToRad(camera.fov);
    const apparentSize = (2 * Math.tan(fov / 2) * 1) / distance;

    if (distance > 0.1) {
      if (apparentSize < minScreenSize) {
        const scale = (minScreenSize / apparentSize) * 1;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  };

  useEffect(() => {
    if (meshRef.current) {
      const raRad = rightAscensionToRadians(s.ra); // Convert RA to radians
      const decRad = declinationToRadians(s.dec); // Convert Dec to radians
      let dist;
      if (!officialStarDistances) {
        dist = 20000;
      } else {
        //Convert light year distance to world units (1Ly = 63241 AU, 1 AU = 100 world units)
        const worldDist = s.distLy * 63241 * 100;
        dist =
          worldDist / (starDistanceModifier >= 1 ? starDistanceModifier : 1); // Distance
      }

      // Convert spherical coordinates (RA, Dec, Dist) to Cartesian coordinates (x, y, z)
      const { x, y, z } = sphericalToCartesian(raRad, decRad, dist);

      // Set the position of the star
      groupRef.current.position.set(x, y, z);
      // updateScale(camera);
      invalidate();
    }
  }, [s, starDistanceModifier, officialStarDistances]);

  const circleTexture = createCircleTexture(color);
  const spriteMaterial = new SpriteMaterial({
    map: circleTexture,
    transparent: true,
    opacity: 1,
    sizeAttenuation: false,
    // depthTest: false,
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

  return (
    <group ref={groupRef} visible={s.visible}>
      <NameLabel s={s} />
      <sprite material={spriteMaterial} scale={[size, size, size]} />
      <mesh name={s.name} ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
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
