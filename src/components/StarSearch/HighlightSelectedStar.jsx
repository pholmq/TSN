import { useStore, useSettingsStore, useStarStore } from "../../store";
import { Text } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import starsData from "../../settings/BSC.json";
import specialStarsData from "../../settings/star-settings.json";
import { getRaDecDistanceFromPosition } from "../../utils/celestial-functions";

const PIXEL_FONT_SIZE = 13;
const TEXT_OFFSET_Y = 10;

const worldPos = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();
const cameraWorldPos = new THREE.Vector3();
const cameraWorldQuat = new THREE.Quaternion();
const cameraForward = new THREE.Vector3();
const vectorToObject = new THREE.Vector3();

export default function HighlightSelectedStar() {
  const { scene } = useThree();
  const selectedStarHR = useStore((s) => s.selectedStarHR);
  const searchStars = useStore((s) => s.searchStars);
  const selectedStarPosition = useStore((s) => s.selectedStarPosition);
  const showLabels = useStore((s) => s.showLabels);
  const setSelectedStarData = useStore((s) => s.setSelectedStarData);

  const planetSettings = useSettingsStore((s) => s.settings);

  const groupRef = useRef();
  const canvasGroupRef = useRef();
  const targetObjectRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const cachedParentScale = useRef(new THREE.Vector3(1, 1, 1));

  useEffect(() => {
    if (canvasGroupRef.current && canvasGroupRef.current.parent) {
      canvasGroupRef.current.parent.getWorldScale(cachedParentScale.current);
    }
  }, []);

  const specialStarDef = useMemo(() => {
    if (!selectedStarHR) return null;
    if (selectedStarHR.startsWith("Special:")) {
      return specialStarsData.find(
        (s) => s.name === selectedStarHR.replace("Special:", "")
      );
    }
    if (selectedStarHR.startsWith("Planet:")) return null;
    return specialStarsData.find(
      (s) => s.HR && String(s.HR) === String(selectedStarHR)
    );
  }, [selectedStarHR]);

  const starName = useMemo(() => {
    if (!selectedStarHR) return null;
    if (selectedStarHR.startsWith("Planet:"))
      return selectedStarHR.replace("Planet:", "");

    let targetHR = selectedStarHR;
    if (specialStarDef && specialStarDef.HR)
      targetHR = String(specialStarDef.HR);
    else if (selectedStarHR.startsWith("Special:"))
      return specialStarDef ? specialStarDef.name : "Unknown";

    const bscStar = starsData.find(
      (s) =>
        (s.HR && String(s.HR) === String(targetHR)) ||
        (s.HIP && `HIP-${s.HIP}` === String(targetHR))
    );

    if (bscStar) {
      const n = specialStarDef?.name || bscStar.N;
      if (n && bscStar.HIP) return `${n} / HIP ${bscStar.HIP}`;
      if (n) return n;
      if (bscStar.HIP) return `HIP ${bscStar.HIP}`;
      return `HR ${bscStar.HR}`;
    }
    if (specialStarDef) return specialStarDef.name;
    return "Unknown";
  }, [selectedStarHR, specialStarDef]);
  useEffect(() => {
    targetObjectRef.current = null;
    if (!selectedStarHR) return;

    let objName = null;
    if (selectedStarHR.startsWith("Planet:"))
      objName = selectedStarHR.replace("Planet:", "");
    else if (specialStarDef) objName = specialStarDef.name;

    if (objName) {
      const obj = scene.getObjectByName(objName);
      if (obj) targetObjectRef.current = obj;
    }
  }, [selectedStarHR, specialStarDef, scene]);

  useEffect(() => {
    if (!selectedStarHR) setSelectedStarData(null);
  }, [selectedStarHR, setSelectedStarData]);

  useFrame(({ camera, size }) => {
    if (!selectedStarHR || !groupRef.current) return;

    if (targetObjectRef.current) {
      targetObjectRef.current.getWorldPosition(groupRef.current.position);
    } else if (selectedStarPosition) {
      groupRef.current.position.copy(selectedStarPosition);
    }

    if (canvasGroupRef.current) {
      cameraWorldPos.setFromMatrixPosition(camera.matrixWorld);
      cameraWorldQuat.setFromRotationMatrix(camera.matrixWorld);

      if (canvasGroupRef.current.parent) {
        canvasGroupRef.current.parent.getWorldQuaternion(parentQuat);
        parentQuat.invert();
        canvasGroupRef.current.quaternion
          .copy(cameraWorldQuat)
          .premultiply(parentQuat);
      } else {
        canvasGroupRef.current.quaternion.copy(cameraWorldQuat);
      }

      canvasGroupRef.current.getWorldPosition(worldPos);

      // Calculate planar depth distance to maintain perfect pixel scaling
      camera.getWorldDirection(cameraForward);
      vectorToObject.subVectors(worldPos, cameraWorldPos);

      const dotProduct = vectorToObject.dot(cameraForward);
      const isBehind = dotProduct < 0;

      // THE FIX: Hide the UI entirely if it is behind the camera
      // to prevent negative-depth screen-space garbling
      canvasGroupRef.current.visible = !isBehind;

      const depthDistance = Math.max(dotProduct, 0.001);

      let unitsPerPixel;
      if (camera.isOrthographicCamera) {
        unitsPerPixel =
          (camera.top - camera.bottom) / camera.zoom / size.height;
      } else {
        const vFov = (camera.fov * Math.PI) / 180;
        unitsPerPixel =
          (2 * Math.tan(vFov / 2) * depthDistance) /
          (size.height * camera.zoom);
      }

      const scaleX = unitsPerPixel / (cachedParentScale.current.x || 1);
      const scaleY = unitsPerPixel / (cachedParentScale.current.y || 1);
      const scaleZ = unitsPerPixel / (cachedParentScale.current.z || 1);

      canvasGroupRef.current.scale.set(scaleX, scaleY, scaleZ);
    }

    const now = performance.now();
    if (now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;
      const currentPos = groupRef.current.position;
      let magnitude = "N/A";

      if (specialStarDef) {
        magnitude = specialStarDef.magnitude || specialStarDef.V;
      } else {
        const star = starsData.find(
          (s) =>
            (s.HR && String(s.HR) === String(selectedStarHR)) ||
            (s.HIP && `HIP-${s.HIP}` === String(selectedStarHR))
        );
        if (star) magnitude = star.V;
      }

      const { ra, dec, dist, elongation } = getRaDecDistanceFromPosition(
        currentPos,
        scene
      );
      setSelectedStarData({ ra, dec, dist, elongation, mag: magnitude });
    }
  });

  const isPlanet = selectedStarHR?.startsWith("Planet:");
  const pName = isPlanet ? selectedStarHR.replace("Planet:", "") : null;
  const pSetting = planetSettings.find((s) => s.name === pName);
  const isPlanetVisible = pSetting ? pSetting.visible : true;
  const hideText = isPlanet && showLabels && isPlanetVisible;

  if (!selectedStarHR || !searchStars) return null;

  return (
    <group ref={groupRef}>
      <group ref={canvasGroupRef}>
        {starName && !hideText && (
          <Text
            raycast={() => null}
            position={[0, TEXT_OFFSET_Y, 0]}
            fontSize={PIXEL_FONT_SIZE}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            transparent={true}
            depthTest={false}
            depthWrite={false}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={9999999}
            outlineWidth={PIXEL_FONT_SIZE * 0.08}
            outlineColor="#000000"
            characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- /:"
          >
            {starName}
          </Text>
        )}
        <mesh position={[0, -14, 0]} renderOrder={9999999} raycast={() => null}>
          <planeGeometry args={[4, 12]} />
          <meshBasicMaterial
            color="yellow"
            transparent={true}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[-14, 0, 0]} renderOrder={9999999} raycast={() => null}>
          <planeGeometry args={[12, 4]} />
          <meshBasicMaterial
            color="yellow"
            transparent={true}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[14, 0, 0]} renderOrder={9999999} raycast={() => null}>
          <planeGeometry args={[12, 4]} />
          <meshBasicMaterial
            color="yellow"
            transparent={true}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
