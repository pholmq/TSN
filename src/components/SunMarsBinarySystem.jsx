import {
  findCelestialNode,
  renderCelestialNode,
} from "./DeclarativeCelestialModel";

/**
 * Backward-compatible view of the declarative Sun-Mars subtree.
 *
 * The named branches and relative-component transforms are deliberately
 * coordinate preserving: they re-express the accepted settings without fitting
 * new orbital parameters. The complete live and plot models now read the same
 * celestial-model.json tree through DeclarativeCelestialModel.
 */
const SunMarsBinarySystem = ({
  ObjectComponent,
  trackLiveState = false,
  plotMode = false,
}) => {
  const mode = plotMode ? "plot" : trackLiveState ? "live" : "structure";
  return renderCelestialNode(
    findCelestialNode("sun-mars-binary"),
    { ObjectComponent, mode },
    "sun-mars-binary"
  );
};

export default SunMarsBinarySystem;
