// 1. Import Suspense from react
import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

const worldPos = new THREE.Vector3();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const planetScale = useStore((state) => state.planetScale);

  const billboardRef = useRef();
  const textRef = useRef();

  const baseSize = actualPlanetSizes ? s.actualSize || s.size : s.size;

  const PIXEL_HEIGHT = 11; // Your smaller font size
  const PIXEL_PADDING = 6;

  useFrame(({ camera, size }) => {
    // This safety check ensures the frame loop doesn't crash while Suspense is loading the font!
    if (!billboardRef.current || !textRef.current) return;

    billboardRef.current.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);

    const vFov = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
    const pixelSize3D = visibleHeight / size.height;

    const textScale = pixelSize3D * PIXEL_HEIGHT;
    textRef.current.scale.set(textScale, textScale, textScale);

    const visualRadius = baseSize * planetScale;
    const yOffset = visualRadius + pixelSize3D * PIXEL_PADDING;

    textRef.current.position.set(0, yOffset, 0);
  });

  if (runIntro || !showLabels) return null;

  return (
    // 2. Wrap the output in a local Suspense boundary
    <Suspense fallback={null}>
      <Billboard ref={billboardRef}>
        <Text
          ref={textRef}
          anchorX="center"
          anchorY="bottom"
          color="#ffffff"
          fontSize={1}
          transparent={true}
          depthTest={false}
          depthWrite={false}
          renderOrder={9999999}
          outlineWidth={0.08}
          outlineColor="#000000"
        >
          {s.name}
        </Text>
      </Billboard>
    </Suspense>
  );
};

export default NameLabel;
