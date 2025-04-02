import { useEffect, useMemo } from "react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

import {
  azEl2RaDec,
  rad2lat,
  rad2lon,
  radiansToAzimuth,
} from "../../utils/celestial-functions";

const PlanetCameraUI = () => {
  const showPositions = useStore((s) => s.showPositions);
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraDirection = useStore((s) => s.planetCameraDirection);
  const { latRotationx, longRotationy, height } = planetCameraDirection;
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Create a custom Leva store
  const plancamUIStore = useCreateStore();
  const [, set] = useControls(
    () => ({
      Latitude: {
        value: rad2lat(latRotationx),
        hint: "Camera latitude in decimal degrees",
        onChange: () => {},
      },
      Longitude: {
        value: rad2lon(longRotationy),
        hint: "Camera longitude in decimal degrees",
        onChange: () => {},
      },
      Height: {
        value: height * 100,
        hint: "Camera height over planet center",
        onChange: () => {},
      },
    }),
    { store: plancamUIStore }
  );

  // Update Leva controls when camera pos changes
  useEffect(() => {
    // console.log(planetCameraDirection.height);

    set({ Latitude: rad2lat(latRotationx) });
    set({ Longitude: rad2lon(longRotationy) });
    set({ Height: height * 100 });
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
