import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

const MARKER_SIZE = 0.0002;
const shaftLength = MARKER_SIZE;
const shaftRadius = MARKER_SIZE * 0.05;
const headLength = MARKER_SIZE * 0.2;
const headRadius = MARKER_SIZE * 0.15;

const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 8);
const headGeo = new THREE.ConeGeometry(headRadius, headLength, 8);

const whiteMat = new THREE.MeshBasicMaterial({
  color: "white",
  depthTest: false,
  depthWrite: false,
  transparent: true,
  opacity: 1,
});

const redMat = new THREE.MeshBasicMaterial({
  color: "red",
  depthTest: false,
  depthWrite: false,
  transparent: true,
  opacity: 1,
});

const cyanMat = new THREE.MeshBasicMaterial({
  color: "cyan",
  depthTest: false,
  depthWrite: false,
  transparent: true,
  opacity: 0.8,
});

// --- CENTERED GEOMETRIES ---
const runwaySphereGeo = new THREE.SphereGeometry(1, 16, 16);

// Centered at origin, stretching along the Z axis from -0.5 to +0.5
const runwayCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
runwayCylinderGeo.rotateX(Math.PI / 2); 

export default function PlanetCameraHelper() {
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);
  const { scene } = useThree();
  
  const groupRef = useRef(null);
  const runwayMarkerRef = useRef(null);
  const runwayLineRef = useRef(null);

  useFrame(() => {
    if (!planetCameraHelper) return;

    const cam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);

    if (cam && cam.parent && pObj && groupRef.current) {
      cam.updateMatrixWorld(true);
      cam.parent.updateMatrixWorld(true);
      
      const pos = new THREE.Vector3();
      cam.getWorldPosition(pos);
      
      groupRef.current.position.copy(pos);
      cam.getWorldQuaternion(groupRef.current.quaternion);

      if (runwayMarkerRef.current && runwayLineRef.current) {
        // 1. EXTRACT PURE YAW (Ignore Pitch)
        const yaw = cam.rotation.y;
        
        // 2. BUILD LOCAL BACKWARD VECTOR
        // In local space, +Z is backward. As yaw rotates, sin(yaw) is X, cos(yaw) is Z.
        // This is perfectly horizontal because Y is 0.
        const localBackward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
        
        // 3. CONVERT TO WORLD SPACE USING THE LEVEL MOUNT
        const worldBackward = localBackward.transformDirection(cam.parent.matrixWorld).normalize();
        const worldUp = new THREE.Vector3(0, 1, 0).transformDirection(cam.parent.matrixWorld).normalize();

        const planetPos = new THREE.Vector3();
        pObj.getWorldPosition(planetPos);
        const altitude = pos.distanceTo(planetPos);
        
        // 4. CALCULATE RUNWAY TARGET (Deep behind the camera, slightly up)
        const runwayPos = pos
          .clone()
          .add(worldBackward.multiplyScalar(altitude * 10))
          .add(worldUp.multiplyScalar(altitude * 0.2));

        const dist = pos.distanceTo(runwayPos);

        // 5. DRAW THE LINE USING THE MIDPOINT
        // By positioning it exactly in the middle and making it stretch the full distance,
        // it cannot overshoot or render backwards.
        const midpoint = pos.clone().lerp(runwayPos, 0.5);
        const lineThickness = dist * 0.005; 
        
        runwayLineRef.current.position.copy(midpoint);
        runwayLineRef.current.up.copy(worldUp);
        runwayLineRef.current.lookAt(runwayPos); 
        runwayLineRef.current.scale.set(lineThickness, lineThickness, dist);

        // 6. POSITION THE SPHERE
        runwayMarkerRef.current.position.copy(runwayPos);
        runwayMarkerRef.current.scale.setScalar(dist * 0.02);
      }
    }
  });

  if (!planetCameraHelper) return null;

  return (
    <>
      <group ref={groupRef}>
        {/* WHITE ARROW: FORWARD (-Z) */}
        <group position={[0, 0, -shaftLength / 2]}>
          <mesh geometry={shaftGeo} material={whiteMat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9999} />
          <mesh geometry={headGeo} material={whiteMat} position={[0, 0, -shaftLength / 2 - headLength / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9999} />
        </group>

        {/* RED ARROW: UP (+Y) */}
        <group position={[0, shaftLength / 2, 0]}>
          <mesh geometry={shaftGeo} material={redMat} renderOrder={9999} />
          <mesh geometry={headGeo} material={redMat} position={[0, shaftLength / 2 + headLength / 2, 0]} renderOrder={9999} />
        </group>
      </group>

      {/* THICK CYAN RUNWAY FLIGHT PATH LINE */}
      <mesh ref={runwayLineRef} geometry={runwayCylinderGeo} material={cyanMat} renderOrder={9998} />
      
      {/* CYAN RUNWAY START POSITION MARKER */}
      <mesh ref={runwayMarkerRef} geometry={runwaySphereGeo} material={cyanMat} renderOrder={9999} />
    </>
  );
}