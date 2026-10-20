import { useMemo } from "react";
import Cobj from "./Cobj";
import { buildRenderTree } from "../utils/celestialModel";

// The scene graph is no longer written out by hand. It is built from the flat
// `objects` list in settings/celestial-model.json (nested via parentId), mode "live".
const renderNode = (node) => {
  const kids = node.children.map(renderNode);

  // Pure grouping node (e.g. the model root): no orbit, no settings entry.
  if (node.kind === "group") {
    return <group key={node.key}>{kids}</group>;
  }

  return (
    <Cobj
      key={node.key}
      name={node.name}
      settingName={node.settingName}
      orbitScale={node.orbitScale}
      hosts={node.hosts}
    >
      {kids}
    </Cobj>
  );
};

const SolarSystem = () => {
  const tree = useMemo(() => buildRenderTree("live"), []);
  return renderNode(tree);
};

export default SolarSystem;
