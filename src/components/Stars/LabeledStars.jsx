import { useRef, Suspense, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";
import labeledStarsData from "../../settings/labeled-stars.json";

export const LABELED_STARS = labeledStarsData;

// Pre-allocate memory outside components
const worldPos = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();

const StarLabelCanvas = ({ name, position }) => {
  const groupRef = useRef();
  const textRef = useRef();

  // Cache the parent scale to avoid 60fps matrix recalculations
  const cachedParentScale = useRef(new THREE.Vector3(1, 1, 1));

  const PIXEL_FONT_SIZE = 13;
  const PIXEL_PADDING = 10;

  // OPTIMIZATION: Only fetch the parent's scale once on mount
  useEffect(() => {
    if (groupRef.current && groupRef.current.parent) {
      groupRef.current.parent.getWorldScale(cachedParentScale.current);
    }
  }, []);

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

    // Use cached scale
    const scaleX = unitsPerPixel / (cachedParentScale.current.x || 1);
    const scaleY = unitsPerPixel / (cachedParentScale.current.y || 1);
    const scaleZ = unitsPerPixel / (cachedParentScale.current.z || 1);

    textRef.current.scale.set(scaleX, scaleY, scaleZ);

    textRef.current.position.set(
      0,
      (PIXEL_PADDING * unitsPerPixel) / (cachedParentScale.current.y || 1),
      0
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <Text
        ref={textRef}
        raycast={() => null} // Prevent label from intercepting star clicks
        fontSize={PIXEL_FONT_SIZE}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        transparent={true}
        depthTest={false}
        depthWrite={false}
        material-depthTest={false}
        material-depthWrite={false}
        renderOrder={9999999}
        outlineWidth={PIXEL_FONT_SIZE * 0.08}
        outlineColor="#000000"
        // OPTIMIZATION: Prevent generation of unused SDF glyphs
        characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- /:"
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
