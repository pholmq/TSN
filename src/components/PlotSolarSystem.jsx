import { useMemo } from "react";
import Pobj from "./Pobj";
import { buildRenderTree } from "../utils/celestialModel";

// ============================================================================
// OPTIONAL EXTRA MOTION IMPORTS
// If you delete the ExtraMotionOperations folder, delete these two imports:
import MotionOperation from "./ExtraMotionOperations/MotionOperation";
import SunRelativeFrame from "./ExtraMotionOperations/SunRelativeFrame";
// ============================================================================

const renderNode = (node) => {
  const kids = node.children.map(renderNode);
  
  if (node.kind === "group") {
    return <group key={node.key}>{kids}</group>;
  }
  
  // ============================================================================
  // OPTIONAL EXTRA MOTION ROUTING
  // If you delete the ExtraMotionOperations folder, delete this if-block:
  if (node.operation) {
    return <MotionOperation key={node.key} name={node.name} operation={node.operation} plotMode>{kids}</MotionOperation>;
  }
  // ============================================================================

  // STANDARD EPICYCLIC RENDERER (Classic behavior)
  const object = (
    <Pobj
      key={node.key}
      name={node.name}
      settingName={node.settingName}
      orbitScale={node.orbitScale}
    >
      {kids}
    </Pobj>
  );

  // ============================================================================
  // OPTIONAL EXTRA MOTION ROUTING
  // If you delete the ExtraMotionOperations folder, delete this if-block:
  if (node.frameType === "sun-relative") {
    return (
      <SunRelativeFrame 
        key={node.key} 
        name={node.name} 
        referenceFrame={node.referenceFrame} 
        plotMode
      >
        {object}
      </SunRelativeFrame>
    );
  }
  // ============================================================================

  return object;
};

const PlotSolarSystem = () => {
  const tree = useMemo(() => buildRenderTree("plot"), []);
  return renderNode(tree);
};

export default PlotSolarSystem;