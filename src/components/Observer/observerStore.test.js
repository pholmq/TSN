import { useObserverStore } from "./observerStore";

describe("observer seeds", () => {
  beforeEach(() => {
    useObserverStore.setState({
      currentGlobalPosition: { x: 0, y: 0, z: 0 },
      seeds: [],
      nextSeedId: 1,
    });
  });

  test("keeps each seed fixed at the position where it was added", () => {
    useObserverStore.setState({
      currentGlobalPosition: { x: 10, y: 20, z: 30 },
    });
    useObserverStore.getState().addSeed(1.25);
    useObserverStore.setState({
      currentGlobalPosition: { x: 40, y: 50, z: 60 },
    });

    expect(useObserverStore.getState().seeds).toEqual([
      {
        id: 1,
        time: 1.25,
        position: { x: 10, y: 20, z: 30 },
      },
    ]);
  });

  test("tags a live global position with its simulation time", () => {
    useObserverStore
      .getState()
      .setCurrentGlobalPosition({ x: 7, y: 8, z: 9 }, 2.5);

    expect(useObserverStore.getState().currentGlobalPosition).toEqual({
      x: 7,
      y: 8,
      z: 9,
    });
    expect(useObserverStore.getState().currentPositionTime).toBe(2.5);
  });

  test("clears additional seeds without clearing the reference", () => {
    useObserverStore.setState({
      referenceGlobalPosition: { x: 1, y: 2, z: 3 },
      seeds: [{ id: 1, time: 0, position: { x: 4, y: 5, z: 6 } }],
    });
    useObserverStore.getState().clearSeeds();

    expect(useObserverStore.getState().seeds).toEqual([]);
    expect(useObserverStore.getState().referenceGlobalPosition).toEqual({
      x: 1,
      y: 2,
      z: 3,
    });
  });
});

describe("observer Earth opacity", () => {
  test("clamps opacity to the visible range", () => {
    useObserverStore.getState().setEarthOpacity(0.35);
    expect(useObserverStore.getState().earthOpacity).toBe(0.35);

    useObserverStore.getState().setEarthOpacity(-1);
    expect(useObserverStore.getState().earthOpacity).toBe(0);

    useObserverStore.getState().setEarthOpacity(2);
    expect(useObserverStore.getState().earthOpacity).toBe(1);
  });
});
