import { movePlotModel } from "./plotModelFunctions";

test("updates special operations after orbital rotations in priority order", () => {
  const orbitRef = { current: { rotation: { y: 0 } } };
  const calls = [];
  const objects = [
    { updateAfterMotion: (time) => calls.push(["offset", time, orbitRef.current.rotation.y]) },
    { speed: 2, startPos: 90, orbitRef },
    { updatePriority: -1, updateAfterMotion: (time) => calls.push(["equant", time, orbitRef.current.rotation.y]) },
    { updatePriority: -2, updateAfterMotion: (time) => calls.push(["frame", time, orbitRef.current.rotation.y]) },
  ];
  movePlotModel(objects, 3);
  expect(calls.map(([name]) => name)).toEqual(["frame", "equant", "offset"]);
  calls.forEach(([, time, rotation]) => {
    expect(time).toBe(3);
    expect(rotation).toBeCloseTo(6 - Math.PI / 2);
  });
  expect(objects[0].updateAfterMotion).toBeDefined();
});
