import { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { SpriteMaterial, MathUtils, Vector3, Color } from "three";
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

export default function Star({ starData }) {
  const { camera, invalidate } = useThree();
  const { settings } = useStarStore();
  const starDistanceModifier = useStore((s) => s.starDistanceModifier);
  const officialStarDistances = useStore((s) => s.officialStarDistances);
  const starScale = useStore((s) => s.starScale);
  let s = {};
  if (!starData.name.length) {
    //No common name, use HIP number
    s.name = starData.hip;
  } else {
    s.name = starData.name[0];
    // console.log(JSON.stringify(starData, null, 2));
  }

  let color;
  if (!starData.K) {
    // console.log( starData.hip + " starData.K empty")
    color = new Color(1, 1, 1);
  } else {
    color = new Color(starData.K.r, starData.K.g, starData.K.b);
  }

  s.raRad = starData.r;
  s.raDec = starData.d;
  s.N = starData.N;

  s.distLy = 3261.56 / starData.p;

  // return null;

  // const color = colorTemperature2rgb(s.colorTemp);

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
      const raRad = s.raRad;
      const decRad = s.raDec;
      console.log("raRad: " + raRad + "raDec: " + s.raDec);
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
      console.log("position for " + s.name + "x: " + x + "y: " + y, "z: " + z);
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
  // if (s.magnitude < 1) {
  //   starsize = 1.2;
  // } else if (s.magnitude > 1 && s.magnitude < 3) {
  //   starsize = 0.6;
  // } else if (s.magnitude > 3 && s.magnitude < 5) {
  //   starsize = 0.4;
  // } else {
  //   starsize = 0.2;
  // }

  if (s.N > 10) {
    starsize = 1.2; // Brightest stars, e.g., Sirius (N = 21.1339), Vega (N = 45.2616), Capella (N = 125.6358), Arcturus (N = 103.3502), Altair (N = 10.2895)
  } else if (s.N > 5 && s.N <= 10) {
    starsize = 0.6; // Medium-bright stars, e.g., Deneb Algedi (N = 7.9694)
  } else if (s.N > 1 && s.N <= 5) {
    starsize = 0.4; // Fainter stars, e.g., Thuban (N = 173.5587)
  } else {
    starsize = 0.2; // Faintest stars, e.g., HD166 (N = 0.5395)
  }

  const size = (starsize / 500) * starScale;
  // console.log(s);
  return (
    <group ref={groupRef}>
      <axesHelper args={[100]} />
      <NameLabel s={s} />
      <sprite material={spriteMaterial} scale={[size, size, size]} />
      <mesh name={s.name} ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <FakeGlowMaterial
          glowColor={`#${color.getHexString()}`}
          falloff={1}
          glowInternalRadius={2}
          glowSharpness={1}
        />
      </mesh>
      <HoverObj s={s} starColor={color} />
    </group>
  );
}
