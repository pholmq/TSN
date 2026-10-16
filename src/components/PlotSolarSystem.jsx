import { useMemo } from "react";
import Pobj from "./Pobj";
import { buildRenderTree } from "../utils/celestialModel";

// The invisible plot/maths model is built from the same `objects` list in
// settings/celestial-model.json as the live scene, using mode "plot"
// (objects marked modes: ["live"], like the "Actual Moon" twin, are skipped).
const renderNode = (node) => {
  const kids = node.children.map(renderNode);

  if (node.kind === "group") {
    return <group key={node.key}>{kids}</group>;
  }

  return (
    <Pobj
      key={node.key}
      name={node.name}
      settingName={node.settingName}
      orbitScale={node.orbitScale}
    >
      {kids}
    </Pobj>
  );
};

const PlotSolarSystem = () => {
  const tree = useMemo(() => buildRenderTree("plot"), []);
  return renderNode(tree);
};

export default PlotSolarSystem;
