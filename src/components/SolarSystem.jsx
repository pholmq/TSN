// src/components/SolarSystem.jsx
import { useMemo } from "react";
import Cobj from "./Cobj";
import MotionOperation from "./MotionOperation";
import SunRelativeFrame from "./SunRelativeFrame";
import { buildRenderTree } from "../utils/celestialModel";

const renderNode = (node) => {
  const kids = node.children.map(renderNode);
  
  if (node.kind === "group") {
    return <group key={node.key}>{kids}</group>;
  }
  
  if (node.operation) {
    return <MotionOperation key={node.key} name={node.name} operation={node.operation}>{kids}</MotionOperation>;
  }

  const object = (
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

  // Replaced hardcoded array with dynamic property
  if (node.frameType === "sun-relative") {
    return (
      <SunRelativeFrame 
        key={node.key} 
        name={node.name} 
        referenceFrame={node.referenceFrame}
      >
        {object}
      </SunRelativeFrame>
    );
  }

  return object;
};

const SolarSystem = () => {
  const tree = useMemo(() => buildRenderTree("live"), []);
  return renderNode(tree);
};

export default SolarSystem;