import { Html } from "@react-three/drei";
import { useStore, useStarStore } from "../../store";
import labeledStarsData from "../../settings/labeled-stars.json"; //

// Export the data so BSCStars.jsx can still access the list for coordinate calculations
export const LABELED_STARS = labeledStarsData; //

export default function LabeledStars() {
  const showLabels = useStore((s) => s.showLabels);
  const runIntro = useStore((s) => s.runIntro);
  const labeledStarPositions = useStore((s) => s.labeledStarPositions);
  const bscVisible = useStarStore((s) => s.BSCStars);

  if (runIntro || !showLabels || !bscVisible) return null;

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
