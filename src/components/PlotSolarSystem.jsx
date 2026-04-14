import Pobj from "./Pobj";

const PlotSolarSystem = () => {
  return (
    <group>
      <Pobj name="SystemCenter">
        <Pobj name="Earth">
          <Pobj name="Moon deferent A">
            <Pobj name="Moon" />
          </Pobj>
          <Pobj name="Sun">
            <Pobj name="Halleys deferent">
              <Pobj name="Halleys" />
            </Pobj>

            <Pobj name="Jupiter deferent">
              <Pobj name="Jupiter" />
            </Pobj>
            <Pobj name="Saturn deferent">
              <Pobj name="Saturn" />
            </Pobj>
            <Pobj name="Uranus deferent">
              <Pobj name="Uranus" />
            </Pobj>
            <Pobj name="Neptune deferent">
              <Pobj name="Neptune" />
            </Pobj>
            <Pobj name="Pluto deferent">
              <Pobj name="Pluto" />
            </Pobj>
          </Pobj>
          <Pobj name="Venus deferent A">
            <Pobj name="Venus deferent B">
              <Pobj name="Venus" />
            </Pobj>
          </Pobj>
          <Pobj name="Mercury deferent A">
            <Pobj name="Mercury deferent B">
              <Pobj name="Mercury" />
            </Pobj>
          </Pobj>
          <Pobj name="Mars deferent E">
            <Pobj name="Mars deferent S">
              <Pobj name="Mars">
                <Pobj name="Phobos" />
                <Pobj name="Deimos" />
              </Pobj>
            </Pobj>
          </Pobj>
          <Pobj name="Eros deferent A">
            <Pobj name="Eros deferent B">
              <Pobj name="Eros"></Pobj>
            </Pobj>
          </Pobj>
        </Pobj>
      </Pobj>
    </group>
  );
};
export default PlotSolarSystem;
