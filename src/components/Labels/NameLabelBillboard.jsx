import { useRef, Suspense, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

const worldPos = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const planetCamera = useStore((state) => state.planetCamera);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const planetScale = useStore((state) => state.planetScale);

  const groupRef = useRef();
  const scaleGroupRef = useRef(); // Protects Troika Text from seeing the scale updates

  const cachedParentScale = useRef(new THREE.Vector3(1, 1, 1));

  const PIXEL_FONT_SIZE = planetCamera ? 11 : 13;
  const PIXEL_PADDING = 10;

  const baseSize = actualPlanetSizes
    ? s.actualSize || s.size || 0
    : s.size || 0;
  const localRadius = baseSize * (planetScale || 1);

  useEffect(() => {
    if (groupRef.current && groupRef.current.parent) {
      groupRef.current.parent.getWorldScale(cachedParentScale.current);
    }
  }, [planetScale]);

  useFrame(({ camera, size }) => {
    if (!groupRef.current || !scaleGroupRef.current) return;

    // Guaranteed current-frame rotation (fixes the 1-frame jitter)
    if (groupRef.current.parent) {
      groupRef.current.parent.getWorldQuaternion(parentQuat);
      parentQuat.invert();
      groupRef.current.quaternion
        .copy(camera.quaternion)
        .premultiply(parentQuat);
    } else {
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // Guaranteed current-frame position (fixes the 1-frame jitter)
    groupRef.current.getWorldPosition(worldPos);

    const distance = camera.position.distanceTo(worldPos);
    const vFov = (camera.fov * Math.PI) / 180;
    const unitsPerPixel = (2 * Math.tan(vFov / 2) * distance) / size.height;

    // Apply scaling strictly to the WRAPPER group, saving massive CPU overhead
    scaleGroupRef.current.scale.set(
      unitsPerPixel / (cachedParentScale.current.x || 1),
      unitsPerPixel / (cachedParentScale.current.y || 1),
      unitsPerPixel / (cachedParentScale.current.z || 1)
    );

    scaleGroupRef.current.position.set(
      0,
      localRadius +
        (PIXEL_PADDING * unitsPerPixel) / (cachedParentScale.current.y || 1),
      0
    );
  });

  if (runIntro || !showLabels) return null;

  return (
    <Suspense fallback={null}>
      <group ref={groupRef}>
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
            characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- "
          >
            {s.name}
          </Text>
        </group>
      </group>
    </Suspense>
  );
};

export default NameLabel;
