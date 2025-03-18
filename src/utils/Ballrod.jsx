function Ballrod({ visible, size = 0.4, length = 2, color = "red" }) {
    return (
      <>
        <group visible={visible} position={[0, length / 2, 0]}>
          {/* Arrow shaft */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[size / 10, size / 10, length, 32]} />
            <meshStandardMaterial color={color} />
          </mesh>
  
          {/* Arrow head */}
          <mesh position={[0, length / 2, 0]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[size / 2, 32, 32]} />
            {/* <coneGeometry args={[size / 4, size, 32]} /> */}
            <meshStandardMaterial color="red" />
          </mesh>
        </group>
      </>
    );
  }
  
  export default Ballrod;
  