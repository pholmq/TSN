// src/components/PlotSolarSystem.jsx
import { useMemo } from "react";
import Pobj from "./Pobj";
import MotionOperation from "./MotionOperation";
import SunRelativeFrame from "./SunRelativeFrame";
import { buildRenderTree } from "../utils/celestialModel";

const renderNode = (node) => {
  const kids = node.children.map(renderNode);
  
  if (node.kind === "group") {
    return <group key={node.key}>{kids}</group>;
  }
  
  if (node.operation) {
    return <MotionOperation key={node.key} name={node.name} operation={node.operation} plotMode>{kids}</MotionOperation>;
  }

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

  // Replaced hardcoded array with dynamic property
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

  return object;
};

const PlotSolarSystem = () => {
  const tree = useMemo(() => buildRenderTree("plot"), []);
  return renderNode(tree);
};

export default PlotSolarSystem;