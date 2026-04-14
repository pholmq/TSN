import Cobj from "./Cobj";

const SolarSystem = () => {
  return (
    <group>
      <Cobj name="SystemCenter">
        <Cobj name="Earth">
          <Cobj name="Moon deferent A">
            <Cobj name="Moon" />
          </Cobj>
          <Cobj name="Actual Moon deferent A">
            <Cobj name="Actual Moon" />
          </Cobj>
          <Cobj name="Sun">
            <Cobj name="Halleys deferent">
              <Cobj name="Halleys" />
            </Cobj>
            <Cobj name="Jupiter deferent">
              <Cobj name="Jupiter" />
            </Cobj>
            <Cobj name="Saturn deferent">
              <Cobj name="Saturn" />
            </Cobj>
            <Cobj name="Uranus deferent">
              <Cobj name="Uranus" />
            </Cobj>
            <Cobj name="Neptune deferent">
              <Cobj name="Neptune" />
            </Cobj>
            <Cobj name="Pluto deferent">
              <Cobj name="Pluto" />
            </Cobj>
          </Cobj>
          <Cobj name="Venus deferent A">
            <Cobj name="Venus deferent B">
              <Cobj name="Venus" />
            </Cobj>
          </Cobj>
          <Cobj name="Mercury deferent A">
            <Cobj name="Mercury deferent B">
              <Cobj name="Mercury" />
            </Cobj>
          </Cobj>
          <Cobj name="Mars deferent E">
            <Cobj name="Mars deferent S">
              <Cobj name="Mars">
                <Cobj name="Phobos" />
                <Cobj name="Deimos" />
              </Cobj>
            </Cobj>
          </Cobj>
          <Cobj name="Eros deferent A">
            <Cobj name="Eros deferent B">
              <Cobj name="Eros" />
            </Cobj>
          </Cobj>
        </Cobj>
      </Cobj>
    </group>
  );
};
export default SolarSystem;
