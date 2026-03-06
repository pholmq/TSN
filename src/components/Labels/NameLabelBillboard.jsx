import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

// Reusable vectors to prevent garbage collection stutter
const worldPos = new THREE.Vector3();
const camWorldPos = new THREE.Vector3();
const parentScale = new THREE.Vector3();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const planetCamera = useStore((state) => state.planetCamera);

  const billboardRef = useRef();
  const textRef = useRef();

  const PIXEL_HEIGHT = planetCamera ? 9 : 13; 
  const PIXEL_OFFSET_Y = PIXEL_HEIGHT * 1.7; 

  useFrame(({ camera, size }) => {
    if (!billboardRef.current || !textRef.current) return;

    // 1. Get exact WORLD position of the label
    billboardRef.current.getWorldPosition(worldPos);

    // 2. THE FIX: Get the exact WORLD position of the camera!
    // We cannot use camera.position because the PlanetCamera is parented to the Earth!
    camera.getWorldPosition(camWorldPos);

    // 3. Calculate true absolute distance in 3D space
    const distance = camWorldPos.distanceTo(worldPos);

    const vFov = (camera.fov * Math.PI) / 180;
    const visibleHeight = (2 * Math.tan(vFov / 2) * distance) / camera.zoom;
    const pixelSize3D = visibleHeight / size.height;

    billboardRef.current.getWorldScale(parentScale);
    const scaleX = parentScale.x || 1;
    const scaleY = parentScale.y || 1;
    const scaleZ = parentScale.z || 1;

    const targetScale = pixelSize3D * PIXEL_HEIGHT;
    textRef.current.scale.set(
      targetScale / scaleX, 
      targetScale / scaleY, 
      targetScale / scaleZ
    );

    const targetY = pixelSize3D * PIXEL_OFFSET_Y;
    textRef.current.position.set(0, targetY / scaleY, 0);
  });

  if (runIntro || !showLabels) return null;

  return (
    <Suspense fallback={null}>
      <Billboard ref={billboardRef}>
        <Text
          ref={textRef}
          anchorX="center"
          anchorY="middle" 
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