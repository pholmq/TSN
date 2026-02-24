import { Html } from "@react-three/drei";
import { useStore } from "../../store";
import labeledStarsData from "../../settings/labeled-stars.json";

export const LABELED_STARS = labeledStarsData;

export default function LabeledStars() {
  const showLabels = useStore((s) => s.showLabels);
  const runIntro = useStore((s) => s.runIntro);
  const labeledStarPositions = useStore((s) => s.labeledStarPositions);
  const bscVisible = useStore((s) => s.BSCStars);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const cameraTarget = useStore((s) => s.cameraTarget);

  // Extract the HR number if the camera is currently targeting a point cloud clone
  const targetedHR = cameraTarget?.startsWith("BSCStarTarget_")
    ? cameraTarget.split("_")[1]
    : null;

  if (runIntro || !showLabels || !bscVisible) return null;

  return (
    <>
      {Array.from(labeledStarPositions.entries()).map(([hr, star]) => {
        // Destroy the static label if the star is actively searched OR targeted by the camera
        if (
          String(hr) === String(selectedStarHR) ||
          String(hr) === String(targetedHR)
        ) {
          return null;
        }

        return (
          <Html
            key={star.name}
            position={star.position}
            portal={{ current: document.body }}
            zIndexRange={[16777271, 100000]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="name-label"
              style={{ transform: "translateX(-50%) translateY(-170%)" }}
            >
              <span>{star.name}</span>
            </div>
          </Html>
        );
      })}
    </>
  );
}
