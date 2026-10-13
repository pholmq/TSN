import { Object3D, Vector3 } from "three";
import {
  SUN_MARS_FRAME_NAME,
  updateFrameCompensation,
} from "./SunPrimaryFrameAdapter";

test("cancels inherited Sun transforms while retaining structural nesting", () => {
  const root = new Object3D();
  root.position.set(7, -4, 2);
  root.rotation.set(0.1, -0.2, 0.05);

  const frame = new Object3D();
  frame.name = SUN_MARS_FRAME_NAME;
  frame.position.set(3, 1, -2);
  root.add(frame);

  const sunParent = new Object3D();
  sunParent.position.set(100, -0.5, 3.3);
  sunParent.rotation.set(0.01, 1.2, -0.02);
  frame.add(sunParent);

  const adapter = new Object3D();
  adapter.matrixAutoUpdate = false;
  sunParent.add(adapter);

  const legacyMarsBranch = new Object3D();
  legacyMarsBranch.position.set(-20, 5, 153);
  legacyMarsBranch.rotation.set(-0.1, 0.7, 0.03);
  adapter.add(legacyMarsBranch);

  expect(updateFrameCompensation(adapter)).toBe(true);
  root.updateMatrixWorld(true);

  const adapterWorld = new Vector3();
  const frameWorld = new Vector3();
  adapter.getWorldPosition(adapterWorld);
  frame.getWorldPosition(frameWorld);
  expect(adapterWorld.distanceTo(frameWorld)).toBeLessThan(1e-10);

  const actualMars = new Vector3();
  legacyMarsBranch.getWorldPosition(actualMars);

  const expectedMars = legacyMarsBranch.position
    .clone()
    .applyMatrix4(frame.matrixWorld);
  expect(actualMars.distanceTo(expectedMars)).toBeLessThan(1e-10);
});

test("fails safely outside the named system frame", () => {
  const parent = new Object3D();
  const adapter = new Object3D();
  parent.add(adapter);
  expect(updateFrameCompensation(adapter)).toBe(false);
});
