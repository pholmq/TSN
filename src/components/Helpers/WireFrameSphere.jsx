import { useRef } from "react";

const WireFrameSphere = ({ s, size, visible }) => {
  const meshRef = useRef();
  const sphereSize = size * 1.01; // 5% larger than the planet

  // Debug log to verify values
  console.log(
    `Planet: ${s.name}, size: ${size}, wireframeSize: ${sphereSize}, visible: ${visible}`
  );

  return (
    <mesh ref={meshRef} visible={visible}>
      <sphereGeometry args={[sphereSize, 32, 32]} />
      <meshBasicMaterial
        color="cyan" // Brighter color for visibility
        wireframe
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
};

export default WireFrameSphere;
