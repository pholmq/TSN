import { useRef, useMemo } from "react";
import * as THREE from "three";

function GeoSphere({ s, size, visible }) {
  const meshRef = useRef();
  const geoSphereSize = size * 1.01;

  const latLongGrid = useMemo(() => {
    const grid = new THREE.Group();

    // Use provided color or fallback to default cyan
    const color = 0x00ffff;

    // Regular grid material
    const gridMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      depthTest: true,
    });

    // THICK EQUATOR SOLUTION --------------------------
    // Create a torus geometry that sits exactly on the equator
    const equatorGeometry = new THREE.TorusGeometry(
      geoSphereSize, // radius
      geoSphereSize * 0.004, // tube thickness (adjust for desired thickness)
      16, // radial segments
      64 // tubular segments
    );
    equatorGeometry.rotateX(Math.PI / 2); // Rotate to align with equator

    const equatorMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      depthTest: true,
    });

    const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    grid.add(equator);

    // LATITUDE LINES (Parallels) --------------------------
    const latitudes = [75, 60, 45, 30, 15, -15, -30, -45, -60, -75]; // Degrees
    latitudes.forEach((lat) => {
      const radius = geoSphereSize * Math.cos((Math.abs(lat) * Math.PI) / 180);
      const y = geoSphereSize * Math.sin((lat * Math.PI) / 180);

      const points = [];
      for (let angle = 0; angle <= 360; angle += 5) {
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const z = radius * Math.sin((angle * Math.PI) / 180);
        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      grid.add(new THREE.Line(geometry, gridMaterial));
    });

    // LONGITUDE LINES (Meridians) ------------------------
    const meridians = 24; // 15° spacing
    for (let i = 0; i < meridians; i++) {
      const lon = i * (360 / meridians);
      const points = [];

      for (let lat = -85; lat <= 85; lat += 5) {
        const x =
          geoSphereSize *
          Math.cos((lat * Math.PI) / 180) *
          Math.cos((lon * Math.PI) / 180);
        const y = geoSphereSize * Math.sin((lat * Math.PI) / 180);
        const z =
          geoSphereSize *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin((lon * Math.PI) / 180);
        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      grid.add(new THREE.Line(geometry, gridMaterial));
    }

    return grid;
  }, [geoSphereSize]);

  return (
    <group visible={visible}>
      <mesh name="GeoSphere" ref={meshRef}>
        {/* <sphereGeometry args={[geoSphereSize, 64, 64]} />
        <meshBasicMaterial 
          color={0xffffff} // Explicit white
          transparent
          opacity={0}
          depthWrite={false}
        /> */}
        <primitive object={latLongGrid} />
      </mesh>
    </group>
  );
}

export default GeoSphere;
