import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useStore } from "../../store";

export const LABELED_STARS = [
  "Polaris",
  "Sirius",
  "Deneb Algedi",
  "Betelgeuse",
  "Rigel",
  "Canopus",
  "Vega",
  "Thuban",
  "Capella",
  "Altair",
  "Aldebaran",
  "Antares",
  "Arcturus",
  "Polaris Australis",
];

export default function LabeledStars() {
  const showLabels = useStore((s) => s.showLabels);
  const runIntro = useStore((s) => s.runIntro);
  const labeledStarPositions = useStore((s) => s.labeledStarPositions);

  if (runIntro || !showLabels) return null;

  return (
    <>
      {Array.from(labeledStarPositions.values()).map((star) => (
        <Html
          key={star.name}
          position={star.position}
          portal={{ current: document.body }}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="name-label"
            style={{ transform: "translateX(-50%) translateY(-170%)" }}
          >
            <span>{star.name}</span>
          </div>
        </Html>
      ))}
    </>
  );
}
