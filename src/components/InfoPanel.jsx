import { useEffect, useLayoutEffect, useRef } from "react";
import { useStore, usePosStore } from "../store";
// import PlanetCameraInfo from "./PlanetCameraInfo";
import PosInfo from "./PosInfo";
const InfoPanel = () => {
  //   const menuRight = useStore((s) => s.menuRight);
  //   const planetCamera = useStore((s) => s.planetCamera);
  //   const planetCameraHelper = useStore((s) => s.planetCameraHelper);
  const showPositions = useStore((s) => s.showPositions);
  return (
    <>
      <div className="info-panel">
        {/* {planetCamera || planetCameraHelper ? <PlanetCameraInfo /> : null} */}
        {/* {showPositions ? <PosInfo /> : null} */}
      </div>
    </>
  );
};

export default InfoPanel;
