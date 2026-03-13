import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

// Pre-allocate variables outside the component to prevent memory leaks in useFrame
const worldPos = new THREE.Vector3();
const parentScale = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const planetCamera = useStore((state) => state.planetCamera);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const planetScale = useStore((state) => state.planetScale);

  const groupRef = useRef();
  const textRef = useRef();

  const PIXEL_FONT_SIZE = planetCamera ? 11 : 13;
  const PIXEL_PADDING = 10; // Increased to push the label slightly further away

  // Calculate the local physical radius to push the label exactly to the planet's top edge
  const baseSize = actualPlanetSizes ? s.actualSize || s.size : s.size;
  const localRadius = baseSize * planetScale;

  useFrame(({ camera, size }) => {
    if (!groupRef.current || !textRef.current) return;

    // 1. Orient strictly horizontally to the screen
    if (groupRef.current.parent) {
      groupRef.current.parent.getWorldQuaternion(parentQuat);
      parentQuat.invert();
      groupRef.current.quaternion
        .copy(camera.quaternion)
        .premultiply(parentQuat);
    } else {
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // 2. Calculate pixel-to-3D ratio
    groupRef.current.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);
    const vFov = (camera.fov * Math.PI) / 180;
    const unitsPerPixel = (2 * Math.tan(vFov / 2) * distance) / size.height;

    // 3. Nullify parent scale for the text font
    groupRef.current.parent.getWorldScale(parentScale);
    const scaleX = unitsPerPixel / (parentScale.x || 1);
    const scaleY = unitsPerPixel / (parentScale.y || 1);
    const scaleZ = unitsPerPixel / (parentScale.z || 1);

    textRef.current.scale.set(scaleX, scaleY, scaleZ);

    // 4. Place exactly centered above:
    // X is 0 (centered), Y is radius + padding
    textRef.current.position.set(
      0,
      localRadius + (PIXEL_PADDING * unitsPerPixel) / (parentScale.y || 1),
      0
    );
  });

  if (runIntro || !showLabels) return null;

  return (
    <Suspense fallback={null}>
      <group ref={groupRef}>
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
          {s.name}
        </Text>
      </group>
    </Suspense>
  );
};

export default NameLabel;
