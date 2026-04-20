import { useRef, Suspense, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";
import labeledStarsData from "../../settings/labeled-stars.json";

export const LABELED_STARS = labeledStarsData;

const worldPos = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();
const cameraWorldPos = new THREE.Vector3();
const cameraWorldQuat = new THREE.Quaternion();
const cameraForward = new THREE.Vector3();
const vectorToObject = new THREE.Vector3();

const StarLabelCanvas = ({ name, position }) => {
  const groupRef = useRef();
  const scaleGroupRef = useRef();

  const cachedParentScale = useRef(new THREE.Vector3(1, 1, 1));

  const PIXEL_FONT_SIZE = 13;
  const PIXEL_PADDING = 10;

  useEffect(() => {
    if (groupRef.current && groupRef.current.parent) {
      groupRef.current.parent.getWorldScale(cachedParentScale.current);
    }
  }, []);

  useFrame(({ camera, size }) => {
    if (!groupRef.current || !scaleGroupRef.current) return;

    cameraWorldPos.setFromMatrixPosition(camera.matrixWorld);
    cameraWorldQuat.setFromRotationMatrix(camera.matrixWorld);

    if (groupRef.current.parent) {
      groupRef.current.parent.getWorldQuaternion(parentQuat);
      parentQuat.invert();
      groupRef.current.quaternion.copy(cameraWorldQuat).premultiply(parentQuat);
    } else {
      groupRef.current.quaternion.copy(cameraWorldQuat);
    }

    groupRef.current.getWorldPosition(worldPos);

    // Project distance along the camera's Z-axis to avoid edge-of-screen distortion
    camera.getWorldDirection(cameraForward);
    vectorToObject.subVectors(worldPos, cameraWorldPos);
    const depthDistance = Math.max(vectorToObject.dot(cameraForward), 0.001);

    let unitsPerPixel;
    if (camera.isOrthographicCamera) {
      unitsPerPixel = (camera.top - camera.bottom) / camera.zoom / size.height;
    } else {
      const vFov = (camera.fov * Math.PI) / 180;
      unitsPerPixel =
        (2 * Math.tan(vFov / 2) * depthDistance) / (size.height * camera.zoom);
    }

    scaleGroupRef.current.scale.set(
      unitsPerPixel / (cachedParentScale.current.x || 1),
      unitsPerPixel / (cachedParentScale.current.y || 1),
      unitsPerPixel / (cachedParentScale.current.z || 1)
    );

    scaleGroupRef.current.position.set(
      0,
      (PIXEL_PADDING * unitsPerPixel) / (cachedParentScale.current.y || 1),
      0
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <group ref={scaleGroupRef}>
        <Text
          raycast={() => null}
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
          characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- /:"
        >
          {name}
        </Text>
      </group>
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
