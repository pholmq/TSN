import { useMemo } from "react"; // Added useMemo
import * as THREE from "three"; // Import THREE for Vector3 and BufferGeometry
import { CanvasTexture, DoubleSide } from "three";
import getCircularText from "../../utils/getCircularText";
import { useStore } from "../../store";

// New component to replace PolarGridHelper
function ZodiacGrid() {
  const geometry = useMemo(() => {
    const points = [];
    const radius = 260; // Matches original args[0]
    const radials = 12; // Changed from 24 to 12 (Only visible spokes)
    const divisions = 64; // Matches original args[3] (Circle smoothness)

    // 1. Generate the 12 visible spokes
    for (let i = 0; i < radials; i++) {
      const angle = (i / radials) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Line from center (0,0,0) to outer edge
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(x, 0, z));
    }

    // 2. Generate the outer circle
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
      <lineBasicMaterial color={0x555555} /> {/* Only the visible grey color */}
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
          transparent={true}
          opacity={1}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[215, 230, 32]} />
        <meshBasicMaterial
          map={texture2}
          side={DoubleSide}
          color={0xffffff}
          transparent={true}
          opacity={1}
        />
      </mesh>
    </group>
  );
}

export default function Zodiac() {
  const zodiac = useStore((s) => s.zodiac);
  const zodiacSize = useStore((s) => s.zodiacSize);
  const hScale = useStore((s) => s.hScale);
  const size = (zodiacSize * hScale) / 100;
  return (
    <>
      {zodiac && (
        <group
          position={[37.8453, -1, 0]}
          rotation={[0, -1.155, 0]}
          scale={size}
        >
          {/* Replaced polarGridHelper with custom ZodiacGrid */}
          <ZodiacGrid />
          <ZodiacLabels />
        </group>
      )}
    </>
  );
}
