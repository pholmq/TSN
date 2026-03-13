import { useRef, Suspense, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

const worldPos = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();
const cameraWorldPos = new THREE.Vector3();
const cameraWorldQuat = new THREE.Quaternion();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const planetCamera = useStore((state) => state.planetCamera);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const planetScale = useStore((state) => state.planetScale);

  const groupRef = useRef();
  const scaleGroupRef = useRef();

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

    // Prevent singularity if camera is exactly inside the object
    const distance = Math.max(cameraWorldPos.distanceTo(worldPos), 0.001);

    // FIX: Incorporate camera.zoom so scrolling/zooming doesn't destroy the pixel scale
    let unitsPerPixel;
    if (camera.isOrthographicCamera) {
      unitsPerPixel = (camera.top - camera.bottom) / camera.zoom / size.height;
    } else {
      const vFov = (camera.fov * Math.PI) / 180;
      unitsPerPixel =
        (2 * Math.tan(vFov / 2) * distance) / (size.height * camera.zoom);
    }

    scaleGroupRef.current.scale.set(
      unitsPerPixel / (cachedParentScale.current.x || 1),
      unitsPerPixel / (cachedParentScale.current.y || 1),
      unitsPerPixel / (cachedParentScale.current.z || 1)
    );

    // FIX: Cap the physical radius offset to a max of 40 screen pixels.
    // When far away, it sits at the crust. When close up, it clamps near the center and stays visible.
    const maxRadiusPixels = 40;
    const effectiveLocalRadius = Math.min(
      localRadius,
      maxRadiusPixels * unitsPerPixel
    );

    scaleGroupRef.current.position.set(
      0,
      effectiveLocalRadius +
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
