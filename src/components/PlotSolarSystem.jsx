import Pobj from "./Pobj";
import DeclarativeCelestialModel from "./DeclarativeCelestialModel";

const PlotSolarSystem = () => {
  return <DeclarativeCelestialModel ObjectComponent={Pobj} mode="plot" />;
};
export default PlotSolarSystem;
