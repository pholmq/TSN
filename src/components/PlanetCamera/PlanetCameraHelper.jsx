import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { useStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";

const MARKER_SIZE = 0.0002;
const shaftLength = MARKER_SIZE;
const shaftRadius = MARKER_SIZE * 0.05;
const headLength = MARKER_SIZE * 0.2;
const headRadius = MARKER_SIZE * 0.15;
const RUNWAY_LENGTH_MULT = 100000000;
const RUNWAY_HEIGHT_MULT = 0.2;
const RUNWAY_MARKER_SIZE = 0.02;

// Geometries & Materials
const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 8);
const headGeo = new THREE.ConeGeometry(headRadius, headLength, 8);
const runwaySphereGeo = new THREE.SphereGeometry(1, 16, 16);
const whiteMat = new THREE.MeshBasicMaterial({ color: "white", depthTest: false, depthWrite: false, transparent: true });
const redMat = new THREE.MeshBasicMaterial({ color: "red", depthTest: false, depthWrite: false, transparent: true });
const cyanMat = new THREE.MeshBasicMaterial({ color: "cyan", depthTest: false, depthWrite: false, transparent: true, opacity: 0.8 });

// PERFORMANCE FIX: Pre-allocate vectors outside the component to prevent GC stutters
const _pos = new THREE.Vector3();
const _planetPos = new THREE.Vector3();
const _localBackward = new THREE.Vector3();
const _worldBackward = new THREE.Vector3();
const _worldUp = new THREE.Vector3();
const _runwayPos = new THREE.Vector3();

export default function PlanetCameraHelper() {
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);
  const { scene, size } = useThree();

  const groupRef = useRef(null);
  const runwayMarkerRef = useRef(null);

  const [lineGeom, lineMat] = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions([0, 0, 0, 0, 0, 0]);
    const material = new LineMaterial({
      color: 0x00ffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      depthWrite: false,
      resolution: new THREE.Vector2(size.width, size.height),
    });
    return [geometry, material];
  }, [size.width, size.height]);

  useFrame(() => {
    if (!planetCameraHelper) return;

    const cam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);

    if (cam && cam.parent && pObj && groupRef.current) {
      // 1. Position Arrow Helpers
      cam.getWorldPosition(_pos);
      groupRef.current.position.copy(_pos);
      cam.getWorldQuaternion(groupRef.current.quaternion);

      // 2. Calculate Runway (Zero Allocations)
      const yaw = cam.rotation.y;
      
      _localBackward.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
      _worldBackward.copy(_localBackward).transformDirection(cam.parent.matrixWorld).normalize();
      _worldUp.set(0, 1, 0).transformDirection(cam.parent.matrixWorld).normalize();

      pObj.getWorldPosition(_planetPos);
      const altitude = _pos.distanceTo(_planetPos);

      _runwayPos.copy(_pos)
        .addScaledVector(_worldBackward, altitude * RUNWAY_LENGTH_MULT)
        .addScaledVector(_worldUp, altitude * RUNWAY_HEIGHT_MULT);

      // 3. Update Line Buffer
      lineGeom.setPositions([
        _pos.x, _pos.y, _pos.z,
        _runwayPos.x, _runwayPos.y, _runwayPos.z
      ]);

      lineMat.resolution.set(size.width, size.height);

      // 4. Update Marker
      if (runwayMarkerRef.current) {
        runwayMarkerRef.current.position.copy(_runwayPos);
        runwayMarkerRef.current.scale.setScalar(_pos.distanceTo(_runwayPos) * RUNWAY_MARKER_SIZE);
      }
    }
  });

  if (!planetCameraHelper) return null;

  return (
    <>
      <group ref={groupRef}>
        {/* Forward Arrow */}
        <group position={[0, 0, -shaftLength / 2]}>
          <mesh geometry={shaftGeo} material={whiteMat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000} />
          <mesh geometry={headGeo} material={whiteMat} position={[0, 0, -shaftLength / 2 - headLength / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1000} />
        </group>
        {/* Up Arrow */}
        <group position={[0, shaftLength / 2, 0]}>
          <mesh geometry={shaftGeo} material={redMat} renderOrder={1000} />
          <mesh geometry={headGeo} material={redMat} position={[0, shaftLength / 2 + headLength / 2, 0]} renderOrder={1000} />
        </group>
      </group>
      
      <primitive object={new Line2(lineGeom, lineMat)} renderOrder={999} />
      <mesh ref={runwayMarkerRef} geometry={runwaySphereGeo} material={cyanMat} renderOrder={1000} />
    </>
  );
}