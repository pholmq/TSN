import Cobj from "./Cobj";

const SolarSystem = () => {
  return (
    <group>
      <Cobj name="SystemCenter">
        <Cobj name="Earth">
          <Cobj name="Moon deferent A">
            <Cobj name="Moon deferent B">
              <Cobj name="Moon" />
            </Cobj>
          </Cobj>
          <Cobj name="Sun deferent">
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
            </Cobj>
          </Cobj>
          <Cobj name="Venus deferent A">
            <Cobj name="Venus deferent B">
              <Cobj name="Venus" />
            </Cobj>
          </Cobj>
          <Cobj name="Mercury def A">
            <Cobj name="Mercury def B">
              <Cobj name="Mercury" />
            </Cobj>
          </Cobj>
          <Cobj name="Mars E deferent">
            <Cobj name="Mars S deferent">
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
