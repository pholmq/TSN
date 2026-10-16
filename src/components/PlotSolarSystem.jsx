import { useMemo } from "react";
import Pobj from "./Pobj";
import { buildRenderTree } from "../utils/celestialModel";

// The invisible plot/maths model is built from the same real objects as the
// live scene. Its orbit coordinates retain the display scale for visual traces;
// physical RA/Dec and ephemeris calculations undo that scale mathematically.
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
