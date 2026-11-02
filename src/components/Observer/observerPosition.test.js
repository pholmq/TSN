import { Vector3 } from "three";
import { getObserverLocalPosition } from "./observerPosition";

describe("getObserverLocalPosition", () => {
  test("keeps an observer on the requested physical radius", () => {
    const result = getObserverLocalPosition({
      latitude: 51.51,
      longitude: -0.13,
      radius: 0.00426,
      time: 0.25,
      rotationStart: 0,
      rotationSpeed: 2301.1694948647196,
    });

    expect(result.length()).toBeCloseTo(0.00426, 10);
  });

  test("places the north pole on the positive local Y axis", () => {
    const result = getObserverLocalPosition({
      latitude: 90,
      longitude: 120,
      radius: 2,
      time: 0,
      rotationStart: 0,
      rotationSpeed: 0,
      target: new Vector3(),
    });

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(2, 10);
    expect(result.z).toBeCloseTo(0, 10);
  });

  test("returns to the same point after one complete rotation", () => {
    const base = getObserverLocalPosition({
      latitude: 0,
      longitude: 0,
      radius: 1,
      time: 0,
      rotationStart: 0,
      rotationSpeed: Math.PI * 2,
    }).clone();
    const rotated = getObserverLocalPosition({
      latitude: 0,
      longitude: 0,
      radius: 1,
      time: 1,
      rotationStart: 0,
      rotationSpeed: Math.PI * 2,
    });

    expect(rotated.distanceTo(base)).toBeLessThan(1e-10);
  });
});
