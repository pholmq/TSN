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
  const textRef = useRef();
  const cachedParentScale = useRef(new THREE.Vector3(1, 1, 1));

  const PIXEL_FONT_SIZE = planetCamera ? 11 : 13;
  const PIXEL_PADDING = 10;

  const baseSize = actualPlanetSizes
    ? s.actualSize || s.size || 0
    : s.size || 0;
  const localRadius = baseSize * (planetScale || 1);

  useEffect(() => {
    if (groupRef.current && groupRef.current.parent) {
      // It is okay to calculate scale once on mount/slider change
      groupRef.current.parent.getWorldScale(cachedParentScale.current);
    }
  }, [planetScale]);

  useFrame(({ camera, size }) => {
    if (!groupRef.current || !textRef.current) return;

    // THE FIX: Read from the cached matrix memory instead of forcing recalculations
    if (groupRef.current.parent) {
      // 0 CPU cost rotation read
      parentQuat.setFromRotationMatrix(groupRef.current.parent.matrixWorld);
      parentQuat.invert();
      groupRef.current.quaternion
        .copy(camera.quaternion)
        .premultiply(parentQuat);
    } else {
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // 0 CPU cost position read
    worldPos.setFromMatrixPosition(groupRef.current.matrixWorld);

    const distance = camera.position.distanceTo(worldPos);
    const vFov = (camera.fov * Math.PI) / 180;
    const unitsPerPixel = (2 * Math.tan(vFov / 2) * distance) / size.height;

    const scaleX = unitsPerPixel / (cachedParentScale.current.x || 1);
    const scaleY = unitsPerPixel / (cachedParentScale.current.y || 1);
    const scaleZ = unitsPerPixel / (cachedParentScale.current.z || 1);

    textRef.current.scale.set(scaleX, scaleY, scaleZ);

    textRef.current.position.set(
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
        <Text
          ref={textRef}
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
    </Suspense>
  );
};

export default NameLabel;
