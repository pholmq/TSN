import Cobj from "./Cobj";
import DeclarativeCelestialModel from "./DeclarativeCelestialModel";

const SolarSystem = () => {
  return <DeclarativeCelestialModel ObjectComponent={Cobj} mode="live" />;
};
export default SolarSystem;
