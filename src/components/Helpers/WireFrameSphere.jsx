import { useRef } from "react";

const WireframeSphere = ({ s, size, visible, planetScale }) => {
  const meshRef = useRef();

  const sphereSize = size + 0.0000001;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[sphereSize, 16, 16]} />
      <meshBasicMaterial color="white" wireframe />
    </mesh>
  );
};

export default WireframeSphere;
