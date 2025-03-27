import { CanvasTexture, DoubleSide } from "three";
import getCircularText from "../../utils/getCircularText";
import { useStore } from "../../store";
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
  return (
    <>
      {zodiac && (
        <group
          position={[37.8453, 0, 0]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={zodiacSize}
        >
          <polarGridHelper args={[260, 24, 1, 64, 0x000000, 0x555555]} />
          <ZodiacLabels />
        </group>
      )}
    </>
  );
}
