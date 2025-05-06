import { useRef, useMemo } from "react";
import * as THREE from "three";

function GeoSphere({ size, visible }) {
  const meshRef = useRef();
  const wireframeRef = useRef();
  const geoSphereSize = size;

  // Create a spherical grid mimicking Earth's latitude and longitude
  const latLongGrid = useMemo(() => {
    const grid = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.3,
    });

    // Latitude lines (parallels) - every 15 degrees
    for (let lat = -75; lat <= 75; lat += 15) {
      const geometry = new THREE.BufferGeometry();
      const points = [];
      const radius = geoSphereSize * Math.cos((lat * Math.PI) / 180);
      const y = geoSphereSize * Math.sin((lat * Math.PI) / 180);

      for (let lon = 0; lon <= 360; lon += 5) {
        const x = radius * Math.cos((lon * Math.PI) / 180);
        const z = radius * Math.sin((lon * Math.PI) / 180);
        points.push(new THREE.Vector3(x, y, z));
      }

      geometry.setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      grid.add(line);
    }

    // Longitude lines (meridians) - every 30 degrees
    for (let lon = 0; lon < 360; lon += 30) {
      const geometry = new THREE.BufferGeometry();
      const points = [];

      for (let lat = -90; lat <= 90; lat += 5) {
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

      geometry.setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      grid.add(line);
    }

    return grid;
  }, [geoSphereSize]);

  return (
    <group visible={visible}>
      <mesh name="GeoSphere" ref={meshRef}>
        {/* Main sphere */}
        <sphereGeometry args={[geoSphereSize, 40, 40]} />
        <meshNormalMaterial
          transparent
          wireframe={false}
          opacity={0}
          depthWrite={false}
        />

        {/* Wireframe edges */}
        <lineSegments ref={wireframeRef}>
          <edgesGeometry
            args={[new THREE.SphereGeometry(geoSphereSize, 40, 40)]}
          />
          <lineBasicMaterial color={0x666666} transparent opacity={0.3} />
        </lineSegments>

        {/* Latitude and longitude grid */}
        <primitive object={latLongGrid} />
      </mesh>
    </group>
  );
}

export default GeoSphere;
