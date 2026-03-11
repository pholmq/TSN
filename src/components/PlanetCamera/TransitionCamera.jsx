import { useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useStore, useSettingsStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import { Ground } from "./Ground";
import { kmToUnits, unitsToKm } from "../../utils/celestial-functions";

const DUR = 12.0;
const ORBIT_PCT = 0.4;
const GLIDE_PCT = 0.85;
const RUNWAY = 0.5;

export default function TransitionCamera() {
  const { scene } = useThree();
  const cam = useRef(null);
  const groundRef = useRef(null);
  const planetCamera = useStore((s) => s.planetCamera);
  const { cameraTransitioning, setCameraTransitioning } = useStore();

  // --- NEW: Pull in altitude and ground settings ---
  const target = usePlanetCameraStore((s) => s.planetCameraTarget);
  const planCamHeight = usePlanetCameraStore((s) => s.planCamHeight);
  const showGround = usePlanetCameraStore((s) => s.showGround);

  // --- NEW: Pre-calculate the exact final opacities based on altitude ---
  const targetOpacities = useMemo(() => {
    const pRadiusKm = unitsToKm(
      useSettingsStore.getState().getSetting(target)?.actualSize || 0.00426
    );
    const low = pRadiusKm * 1.0005;
    const high = pRadiusKm * 1.001;

    let pOpacity =
      planCamHeight <= low
        ? 0
        : planCamHeight >= high
        ? 1
        : Math.pow((planCamHeight - low) / (high - low), 3);

    let gOpacity = 1 - pOpacity;

    return {
      planet: showGround ? pOpacity : 0,
      ground: showGround ? gOpacity : 0,
    };
  }, [planCamHeight, target, showGround]);

  const state = useMemo(
    () => ({
      t: 0,
      orbitDist: 0,
      startFov: 50,
      endFov: 50,
      startPos: new THREE.Vector3(),
      startQuat: new THREE.Quaternion(),
      endPos: new THREE.Vector3(),
      endQuat: new THREE.Quaternion(),
      center: new THREE.Vector3(),
      curve: new THREE.CubicBezierCurve3(),
      vStart: new THREE.Vector3(),
      vMid: new THREE.Vector3(),
      axis: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      startUp: new THREE.Vector3(),
      endUp: new THREE.Vector3(),
      leveledUp: new THREE.Vector3(),
      leveledQuat: new THREE.Quaternion(),
      look: new THREE.Vector3(),
      sight: new THREE.Vector3(),
      startSight: new THREE.Vector3(),
      vCur: new THREE.Vector3(),
      temp: new THREE.Vector3(),
      angle: 0,
      groundPos: new THREE.Vector3(),
    }),
    []
  );

  useEffect(() => {
    const skip = (e) => {
      if (e.button === 0 && cameraTransitioning) state.t = 1.0;
    };
    window.addEventListener("pointerdown", skip);
    return () => window.removeEventListener("pointerdown", skip);
  }, [cameraTransitioning, state]);

  useEffect(() => {
    if (planetCamera) setCameraTransitioning(true);
  }, [planetCamera, setCameraTransitioning]);

  useLayoutEffect(() => {
    if (!cameraTransitioning || !cam.current) return;

    const oCam = scene.getObjectByName("OrbitCamera");
    const pCam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);
    const mount = pCam?.parent;
    if (!oCam || !pCam || !pObj || !mount) return;

    if (pObj.material) {
      pObj.material.transparent = true;
      pObj.material.opacity = 1.0;
      pObj.material.needsUpdate = true;
    }

    [oCam, pCam, pObj, mount].forEach((obj) => obj.updateMatrixWorld(true));

    state.t = 0;
    oCam.getWorldPosition(state.startPos);
    oCam.getWorldQuaternion(state.startQuat);
    pCam.getWorldPosition(state.endPos);
    pCam.getWorldQuaternion(state.endQuat);
    pObj.getWorldPosition(state.center);

    state.startUp.set(0, 1, 0).applyQuaternion(state.startQuat);
    state.endUp.set(0, 1, 0).applyQuaternion(state.endQuat);
    pCam.getWorldDirection(state.dir);

    state.startFov = oCam.fov;
    state.endFov = pCam.fov;
    state.orbitDist = state.startPos.distanceTo(state.center);

    const oCamForward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(state.startQuat)
      .normalize();
    state.startSight
      .copy(state.startPos)
      .add(oCamForward.multiplyScalar(state.orbitDist));

    const mountQuat = new THREE.Quaternion();
    mount.getWorldQuaternion(mountQuat);
    const localYawQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      pCam.rotation.y
    );
    state.leveledQuat.copy(mountQuat).multiply(localYawQuat);

    const worldBackward = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(state.leveledQuat)
      .normalize();
    state.leveledUp.set(0, 1, 0).applyQuaternion(state.leveledQuat).normalize();

    const planetRadiusKm = unitsToKm(
      useSettingsStore.getState().getSetting(target)?.actualSize || 0.00426
    );
    const groundHeightUnits = kmToUnits(
      usePlanetCameraStore.getState().groundHeight
    );
    const groundOffset = kmToUnits(planetRadiusKm) + groundHeightUnits;
    state.groundPos
      .copy(state.center)
      .add(state.leveledUp.clone().multiplyScalar(groundOffset));

    const mid = state.center
      .clone()
      .add(
        worldBackward
          .clone()
          .add(state.leveledUp)
          .normalize()
          .multiplyScalar(state.orbitDist)
      );

    const p2 = state.endPos
      .clone()
      .add(worldBackward.clone().multiplyScalar(state.orbitDist * RUNWAY));
    const p1 = mid
      .clone()
      .lerp(p2, 0.5)
      .add(state.leveledUp.clone().multiplyScalar(state.orbitDist * 0.4));
    state.curve.v0.copy(mid);
    state.curve.v1.copy(p1);
    state.curve.v2.copy(p2);
    state.curve.v3.copy(state.endPos);

    const forward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(state.leveledQuat)
      .normalize();
    state.sight
      .copy(state.endPos)
      .add(forward.multiplyScalar(state.orbitDist * 0.5));

    state.vStart.subVectors(state.startPos, state.center).normalize();
    state.vMid.subVectors(mid, state.center).normalize();
    state.angle = state.vStart.angleTo(state.vMid);
    state.axis.crossVectors(state.vStart, state.vMid).normalize();

    cam.current.fov = state.startFov;
    cam.current.position.copy(state.startPos);
    cam.current.quaternion.copy(state.startQuat);
    cam.current.updateProjectionMatrix();
  }, [cameraTransitioning, scene, target, state]);

  useFrame((_, delta) => {
    if (!cameraTransitioning || !cam.current) return;
    state.t += delta / DUR;

    const pCam = scene.getObjectByName("PlanetCamera");
    const pObj = scene.getObjectByName(target);

    if (pCam) {
      pCam.getWorldPosition(state.endPos);
      pCam.getWorldQuaternion(state.endQuat);
    }

    // --- FIX: DYNAMICALLY FADE PLANET OPACITY ---
    if (pObj && pObj.material) {
      // Linearly fade the planet from 1.0 to its target opacity as we approach
      pObj.material.opacity = THREE.MathUtils.lerp(
        1.0,
        targetOpacities.planet,
        state.t
      );
    }

    // --- FIX: CONDITIONAL GROUND FADE LOGIC ---
    if (groundRef.current) {
      groundRef.current.position.copy(state.groundPos);
      groundRef.current.quaternion.copy(state.leveledQuat);

      // Only fade in the ground if the target camera altitude says it should be visible
      if (state.t > 0.5 && targetOpacities.ground > 0) {
        groundRef.current.visible = true;
        const fade = THREE.MathUtils.clamp((state.t - 0.5) / 0.3, 0, 1);

        groundRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            const baseOpacity = child.userData.baseOpacity || 1;
            child.material.transparent = true;
            // Limit the maximum fade by the target's gOpacity
            child.material.opacity =
              baseOpacity * fade * targetOpacities.ground;
          }
        });
      } else {
        groundRef.current.visible = false;
      }
    }

    if (state.t >= 1.0) {
      cam.current.position.copy(state.endPos);
      cam.current.quaternion.copy(state.endQuat);
      cam.current.fov = state.endFov;
      cam.current.updateProjectionMatrix();

      // Ensure exact final opacity before handing off
      if (pObj && pObj.material) pObj.material.opacity = targetOpacities.planet;

      setCameraTransitioning(false);
      return;
    }

    const easeOutEx = (x) => 1 - Math.pow(1 - x, 6);
    const easeInOut = (x) =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

    if (state.t <= ORBIT_PCT) {
      const localT = state.t / ORBIT_PCT;
      const t = easeInOut(localT);

      state.vCur.copy(state.vStart).applyAxisAngle(state.axis, state.angle * t);
      cam.current.position
        .copy(state.center)
        .add(state.vCur.multiplyScalar(state.orbitDist));

      cam.current.up.copy(state.startUp);
      state.look.copy(state.startSight).lerp(state.endPos, t);
      cam.current.lookAt(state.look);
    } else if (state.t <= GLIDE_PCT) {
      const localT = (state.t - ORBIT_PCT) / (GLIDE_PCT - ORBIT_PCT);
      const tPos = easeOutEx(localT);
      const tLook = easeInOut(localT);

      state.curve.getPoint(tPos, cam.current.position);

      const landingRadius = state.endPos.distanceTo(state.center);
      const currentRadius = cam.current.position.distanceTo(state.center);

      if (currentRadius < landingRadius) {
        const outwardDir = cam.current.position
          .clone()
          .sub(state.center)
          .normalize();
        cam.current.position
          .copy(state.center)
          .add(outwardDir.multiplyScalar(landingRadius));
      }

      cam.current.up
        .copy(state.startUp)
        .lerp(state.leveledUp, tLook)
        .normalize();

      state.look.copy(state.endPos).lerp(state.sight, tLook);
      cam.current.lookAt(state.look);

      cam.current.fov = THREE.MathUtils.lerp(
        state.startFov,
        state.endFov,
        tLook
      );
      cam.current.updateProjectionMatrix();
    } else {
      const localT = (state.t - GLIDE_PCT) / (1 - GLIDE_PCT);
      const t = easeInOut(localT);

      cam.current.position.copy(state.endPos);

      cam.current.quaternion.slerpQuaternions(
        state.leveledQuat,
        state.endQuat,
        t
      );

      cam.current.fov = state.endFov;
      cam.current.updateProjectionMatrix();
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cam}
        makeDefault={cameraTransitioning}
        near={0.0001}
        far={10000000}
      />
      {/* <group ref={groundRef} visible={false}>
        <Ground />
      </group> */}
    </>
  );
}
