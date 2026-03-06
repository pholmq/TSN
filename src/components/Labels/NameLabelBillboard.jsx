import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useStore } from "../../store";
import * as THREE from "three";

const worldPos = new THREE.Vector3();
const camWorldPos = new THREE.Vector3();
const parentScale = new THREE.Vector3();

const NameLabel = ({ s }) => {
  const showLabels = useStore((state) => state.showLabels);
  const runIntro = useStore((state) => state.runIntro);
  const actualPlanetSizes = useStore((state) => state.actualPlanetSizes);
  const planetScale = useStore((state) => state.planetScale);
  const planetCamera = useStore((state) => state.planetCamera);

  const billboardRef = useRef();
  const textRef = useRef();

  const baseSize = actualPlanetSizes ? (s.actualSize || s.size) : s.size;
  
  // Set the larger pixel sizes for Planet Camera mode
  const PIXEL_HEIGHT = planetCamera ? 11 : 13; 
  const PIXEL_PADDING = planetCamera ? 4 : 6; 

  useFrame(({ camera, size }) => {
    if (!billboardRef.current || !textRef.current) return;

    billboardRef.current.getWorldPosition(worldPos);
    camera.getWorldPosition(camWorldPos);
    const distance = camWorldPos.distanceTo(worldPos);

    const vFov = (camera.fov * Math.PI) / 180;
    const visibleHeight = (2 * Math.tan(vFov / 2) * distance) / camera.zoom;
    const pixelSize3D = visibleHeight / size.height;

    billboardRef.current.getWorldScale(parentScale);
    const scaleX = parentScale.x || 1;
    const scaleY = parentScale.y || 1;
    const scaleZ = parentScale.z || 1;

    // 1. Maintain locked screen-pixel size
    const targetScale = pixelSize3D * PIXEL_HEIGHT;
    textRef.current.scale.set(
      targetScale / scaleX, 
      targetScale / scaleY, 
      targetScale / scaleZ
    );

    // 2. THE CRUST LOGIC: 
    // The visual radius is ALREADY in local 3D space, so it needs NO division.
    const localCrustRadius = baseSize * planetScale;
    
    // The 6-pixel gap is in WORLD space, so we MUST divide it by scaleY to match local space.
    const localPadding = (pixelSize3D * PIXEL_PADDING) / scaleY;

    // 3. Stack them cleanly
    textRef.current.position.set(0, localCrustRadius + localPadding, 0);
  });

  if (runIntro || !showLabels) return null;

  return (
    <Suspense fallback={null}>
      <Billboard ref={billboardRef}>
        <Text
          ref={textRef}
          anchorX="center"
          // Crucial: Anchor to the bottom so the text grows UPWARDS from the crust!
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