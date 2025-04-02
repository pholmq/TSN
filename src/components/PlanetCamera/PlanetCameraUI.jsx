import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

const PlanetCameraUI = () => {
  const showPositions = useStore((s) => s.showPositions);
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraDirection = useStore((s) => s.planetCameraDirection);
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Create a custom Leva store
  const plancamUIStore = useCreateStore();
  const [, set] = useControls(
    () => ({
      Latitude: { value: "10'30#" },
    }),
    { store: plancamUIStore }
  );

  // Update Leva controls when camera pos change
  useEffect(() => {
    console.log({...planetCameraDirection});
  }, [planetCameraDirection]);

  return (
    <>
      {planetCamera && (
        <div className="plancam-div">
          <Leva
            store={plancamUIStore}
            titleBar={{ drag: true, title: "Planet camera", filter: false }}
            fill={false}
            hideCopyButton
            theme={{
              fontSizes: {
                root: "16px",
              },
              fonts: {
                mono: "",
              },
              colors: {
                highlight1: "#FFFFFF",
                highlight2: "#FFFFFF",
              },
            }}
          />
        </div>
      )}
    </>
  );
};

export default PlanetCameraUI;
