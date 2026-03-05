import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

const worldPos = new THREE.Vector3();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);

  // THE MISSING PIECE: We must factor in the artificial UI scaling!
  const planetScale = useStore((state) => state.planetScale);

  const billboardRef = useRef();
  const textRef = useRef();

  // 1. Get the base physical size identical to Planet.jsx
  const baseSize = actualPlanetSizes ? s.actualSize || s.size : s.size;

  // 2. Define exact CSS pixel preferences
  const PIXEL_HEIGHT = 12;
  const PIXEL_PADDING = 4;

  useFrame(({ camera, size }) => {
    if (!billboardRef.current || !textRef.current) return;

    // Get true distance from camera to the planet core
    billboardRef.current.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);

    // Calculate 3D size of one 2D pixel at this exact distance
    const vFov = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
    const pixelSize3D = visibleHeight / size.height;

    // Scale the text so it maintains a locked CSS pixel height
    const textScale = pixelSize3D * PIXEL_HEIGHT;
    textRef.current.scale.set(textScale, textScale, textScale);

    // THE FIX: Multiply baseSize by the global planetScale to find the TRUE visual crust
    const visualRadius = baseSize * planetScale;

    // Position the text straight up on the screen, exactly at the edge of the scaled planet + padding
    const yOffset = visualRadius + pixelSize3D * PIXEL_PADDING;
    textRef.current.position.set(0, yOffset, 0);
  });

  if (runIntro || !showLabels) return null;

  return (
    <Billboard ref={billboardRef}>
      <Text
        ref={textRef}
        anchorX="center"
        anchorY="bottom" // Anchor bottom so it grows upwards away from the planet
        color="#ffffff"
        fontSize={1}
        // Zero flickering: Completely bypass 3D depth limits
        transparent={true}
        depthTest={false}
        depthWrite={false}
        renderOrder={9999999}
        // Native UI drop-shadow effect
        outlineWidth={0.08}
        outlineColor="#000000"
      >
        {s.name}
      </Text>
    </Billboard>
  );
};

export default NameLabel;
