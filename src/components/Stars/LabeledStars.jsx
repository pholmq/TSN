import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";
import labeledStarsData from "../../settings/labeled-stars.json";

export const LABELED_STARS = labeledStarsData;

// Pre-allocate memory outside components
const worldPos = new THREE.Vector3();
const parentScale = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();

const StarLabelCanvas = ({ name, position }) => {
  const groupRef = useRef();
  const textRef = useRef();

  const PIXEL_FONT_SIZE = 13;
  const PIXEL_PADDING = 10; // Increased to hover further above the star

  useFrame(({ camera, size }) => {
    if (!groupRef.current || !textRef.current) return;

    if (groupRef.current.parent) {
      groupRef.current.parent.getWorldQuaternion(parentQuat);
      parentQuat.invert();
      groupRef.current.quaternion
        .copy(camera.quaternion)
        .premultiply(parentQuat);
    } else {
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    groupRef.current.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);
    const vFov = (camera.fov * Math.PI) / 180;
    const unitsPerPixel = (2 * Math.tan(vFov / 2) * distance) / size.height;

    groupRef.current.parent.getWorldScale(parentScale);
    const scaleX = unitsPerPixel / (parentScale.x || 1);
    const scaleY = unitsPerPixel / (parentScale.y || 1);
    const scaleZ = unitsPerPixel / (parentScale.z || 1);

    textRef.current.scale.set(scaleX, scaleY, scaleZ);

    // X is 0 (centered), push Y strictly upwards
    textRef.current.position.set(
      0,
      (PIXEL_PADDING * unitsPerPixel) / (parentScale.y || 1),
      0
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <Text
        ref={textRef}
        fontSize={PIXEL_FONT_SIZE}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        transparent={true}
        depthTest={false}
        depthWrite={false}
        renderOrder={9999999}
        outlineWidth={PIXEL_FONT_SIZE * 0.08}
        outlineColor="#000000"
      >
        {name}
      </Text>
    </group>
  );
};

export default function LabeledStars() {
  const showLabels = useStore((s) => s.showLabels);
  const runIntro = useStore((s) => s.runIntro);
  const labeledStarPositions = useStore((s) => s.labeledStarPositions);
  const bscVisible = useStore((s) => s.BSCStars);

  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const cameraTarget = useStore((s) => s.cameraTarget);

  const targetedHR = cameraTarget?.startsWith("BSCStarTarget_")
    ? cameraTarget.split("_")[1]
    : null;

  if (runIntro || !showLabels || !bscVisible) return null;

  return (
    <Suspense fallback={null}>
      {Array.from(labeledStarPositions.entries()).map(([hr, star]) => {
        if (
          String(hr) === String(selectedStarHR) ||
          String(hr) === String(targetedHR)
        ) {
          return null;
        }

        return (
          <StarLabelCanvas
            key={star.name}
            name={star.name}
            position={star.position}
          />
        );
      })}
    </Suspense>
  );
}
