import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import createCircleTexture from "../../utils/createCircleTexture";

const circleTexture = createCircleTexture("red");
const spriteMaterial = new THREE.SpriteMaterial({
  map: circleTexture,
  transparent: true,
  opacity: 1,
  sizeAttenuation: false,
});

const worldPos = new THREE.Vector3();
const parentQuat = new THREE.Quaternion();
const cameraWorldPos = new THREE.Vector3();
const cameraWorldQuat = new THREE.Quaternion();
const cameraForward = new THREE.Vector3();
const vectorToObject = new THREE.Vector3();

export const OrbitDisplacementLine = ({ center, lineWidth }) => {
  return (
    <group>
      <Line
        points={[[0, 0, 0], center]}
        color="yellow"
        lineWidth={lineWidth}
        dashed={false}
        raycast={() => null}
        toneMapped={false}
      />
      <sprite
        position={[0, 0, 0]}
        material={spriteMaterial}
        scale={[0.002, 0.002, 0.002]}
      />
    </group>
  );
};

export const OrbitCenterLabel = ({ name }) => {
  const axesRef = useRef();
  const textPositionRef = useRef();
  const billboardRef = useRef();
  const textScaleRef = useRef();
  const cachedParentScale = useRef(new THREE.Vector3(1, 1, 1));

  // --- Visual Settings ---
  const PIXEL_FONT_SIZE = 13;
  const AXIS_PIXEL_LENGTH = 30; // The green line will always be exactly 30px long on screen
  const TEXT_PADDING_PIXELS = 4; // Gap between the green line tip and the text

  useEffect(() => {
    if (axesRef.current && axesRef.current.parent) {
      axesRef.current.parent.getWorldScale(cachedParentScale.current);
    }
  }, []);

  useFrame(({ camera, size }) => {
    if (!axesRef.current || !billboardRef.current || !textScaleRef.current || !textPositionRef.current) return;

    // 1. Calculate how many world units equal one screen pixel at this distance
    cameraWorldPos.setFromMatrixPosition(camera.matrixWorld);
    axesRef.current.getWorldPosition(worldPos);
    camera.getWorldDirection(cameraForward);
    vectorToObject.subVectors(worldPos, cameraWorldPos);

    const depthDistance = Math.max(vectorToObject.dot(cameraForward), 0.001);

    let unitsPerPixel;
    if (camera.isOrthographicCamera) {
      unitsPerPixel = (camera.top - camera.bottom) / camera.zoom / size.height;
    } else {
      const vFov = (camera.fov * Math.PI) / 180;
      unitsPerPixel = (2 * Math.tan(vFov / 2) * depthDistance) / (size.height * camera.zoom);
    }

    const pScaleX = cachedParentScale.current.x || 1;
    const pScaleY = cachedParentScale.current.y || 1;
    const pScaleZ = cachedParentScale.current.z || 1;

    // 2. Scale the 3D axes so they remain exactly 30 screen-pixels long
    const axisWorldLengthY = (AXIS_PIXEL_LENGTH * unitsPerPixel) / pScaleY;
    axesRef.current.scale.set(
      (AXIS_PIXEL_LENGTH * unitsPerPixel) / pScaleX,
      axisWorldLengthY,
      (AXIS_PIXEL_LENGTH * unitsPerPixel) / pScaleZ
    );

    // 3. Pin the text anchor to the exact physical tip of the Y-axis (green line)
    const textOffsetWorld = ((AXIS_PIXEL_LENGTH + TEXT_PADDING_PIXELS) * unitsPerPixel) / pScaleY;
    textPositionRef.current.position.set(0, textOffsetWorld, 0);

    // 4. Billboard the text (counteract the orbit's rotation so text always faces the camera)
    cameraWorldQuat.setFromRotationMatrix(camera.matrixWorld);
    if (billboardRef.current.parent) {
      billboardRef.current.parent.getWorldQuaternion(parentQuat);
      parentQuat.invert();
      billboardRef.current.quaternion.copy(cameraWorldQuat).premultiply(parentQuat);
    } else {
      billboardRef.current.quaternion.copy(cameraWorldQuat);
    }

    // 5. Scale the text so it maintains exact pixel dimensions
    textScaleRef.current.scale.set(
      unitsPerPixel / pScaleX,
      unitsPerPixel / pScaleY,
      unitsPerPixel / pScaleZ
    );
  });

  return (
    <group>
      {/* 1. Base axes helper, default length 1, scaled dynamically */}
      <axesHelper ref={axesRef} args={[1]} />

      {/* 2. Positioned at the tip of the dynamically scaled Y-axis */}
      <group ref={textPositionRef}>
        {/* 3. Rotated to face the camera */}
        <group ref={billboardRef}>
          {/* 4. Scaled to maintain exact 13px font size */}
          <group ref={textScaleRef}>
            <Text
              raycast={() => null}
              fontSize={PIXEL_FONT_SIZE}
              color="yellow"
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
              characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- "
            >
              {name}
            </Text>
          </group>
        </group>
      </group>
    </group>
  );
};