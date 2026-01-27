import { useMemo } from "react";
import * as THREE from "three";
import { CanvasTexture, DoubleSide } from "three";
import getCircularText from "../../utils/getCircularText";
import { useStore } from "../../store";

function ZodiacGrid() {
  const geometry = useMemo(() => {
    const points = [];
    const radius = 260;
    const radials = 12;
    const divisions = 64;

    // 12 Visible Spokes
    for (let i = 0; i < radials; i++) {
      const angle = (i / radials) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(x, 0, z));
    }

    // Outer Circle
    for (let i = 0; i < divisions; i++) {
      const t1 = (i / divisions) * Math.PI * 2;
      const t2 = ((i + 1) / divisions) * Math.PI * 2;
      points.push(
        new THREE.Vector3(Math.cos(t1) * radius, 0, Math.sin(t1) * radius)
      );
      points.push(
        new THREE.Vector3(Math.cos(t2) * radius, 0, Math.sin(t2) * radius)
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={0xffaa00} opacity={0.6} transparent />
    </lineSegments>
  );
}

function ZodiacLabels() {
  const names =
    "      GEMINI" +
    "             TAURUS" +
    "             ARIES" +
    "             PISCES" +
    "          AQUARIUS" +
    "       CAPRICORN" +
    "     SAGITTARIUS" +
    "      SCORPIO" +
    "             LIBRA" +
    "              VIRGO" +
    "                LEO" +
    "               CANCER";
  const text1 = getCircularText(
    names,
    800,
    0,
    "right",
    false,
    true,
    "Arial",
    "18pt",
    2
  );
  const texture1 = new CanvasTexture(text1);

  const symbols =
    "           ♊" +
    "                      ♉" +
    "                     ♈" +
    "                      ♓" +
    "                     ♒" +
    "                      ♑" +
    "                     ♐" +
    "                      ♏" +
    "                      ♎" +
    "                     ♍" +
    "                      ♌" +
    "                      ♋";
  const text2 = getCircularText(
    symbols,
    800,
    0,
    "right",
    false,
    true,
    "Segoe UI Symbol",
    "18pt",
    2
  );
  const texture2 = new CanvasTexture(text2);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[235, 250, 32]} />
        <meshBasicMaterial
          map={texture1}
          side={DoubleSide}
          transparent
          opacity={1}
          color={0xffaa00}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[215, 230, 32]} />
        <meshBasicMaterial
          map={texture2}
          side={DoubleSide}
          transparent
          opacity={1}
          color={0xffaa00}
        />
      </mesh>
    </group>
  );
}

export default function TropicalZodiac() {
  const tropicalZodiac = useStore((s) => s.tropicalZodiac);
  const zodiacSize = 100;
  const hScale = useStore((s) => s.hScale);
  const size = (zodiacSize * hScale) / 100;

  // CALIBRATION: Adjust this if Aries doesn't align with the Vernal Equinox vector
  // -1.57 is -90 degrees (standard 3 o'clock start offset)
  const ROTATION_OFFSET = -Math.PI / 2;

  return (
    <>
      {tropicalZodiac && (
        <group
          // Position is 0,0,0 relative to parent (Earth)
          // We apply a small Y offset (-3) to match the Sidereal vertical level
          position={[0, -0.01, 0]}
          rotation={[0, ROTATION_OFFSET, 0]}
          scale={size}
        >
          <ZodiacGrid />
          <ZodiacLabels />
        </group>
      )}
    </>
  );
}
