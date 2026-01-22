export function movePlotModel(plotObjects, plotPos) {
  plotObjects.forEach((pObj) => {
    pObj.orbitRef.current.rotation.y =
      pObj.speed * plotPos - pObj.startPos * (Math.PI / 180);
  });
}
