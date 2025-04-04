import { useEffect, useMemo, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import { useControls, useCreateStore, Leva, folder } from "leva";
import { useStore, useSettingsStore, usePosStore } from "../../store";

import {
  azEl2RaDec,
  rad2lat,
  lat2rad,
  rad2lon,
  radiansToAzimuth,
} from "../../utils/celestial-functions";

const PlanetCameraUI = () => {
  const showPositions = useStore((s) => s.showPositions);
  const planetCamera = useStore((s) => s.planetCamera);
  const setPlanetCamera = useStore((s) => s.setPlanetCamera);
  const planetCameraHelper = useStore((s) => s.planetCameraHelper);

  const planetCameraMenu = useStore((s) => s.planetCameraMenu);
  const planetCameraDirection = useStore((s) => s.planetCameraDirection);

  const setPlanetCameraDirection = useStore((s) => s.setPlanetCameraDirection);
  const {
    camRotationx,
    camRotationy,
    camFov,
    latRotationx,
    longRotationy,
    height,
  } = planetCameraDirection;

  const planCamLat = useStore((s) => s.planCamLat);
  const setPlanCamLat = useStore((s) => s.setPlanCamLat);
  const planCamLong = useStore((s) => s.planCamLong);
  const setPlanCamLong = useStore((s) => s.setPlanCamLong);
  const planCamHeight = useStore((s) => s.planCamHeight);
  const setPlanCamHeight = useStore((s) => s.setPlanCamHeight);
  const planCamAngle = useStore((s) => s.planCamAngle);
  const setPlanCamAngle = useStore((s) => s.setPlanCamAngle);
  const planCamDirection = useStore((s) => s.planCamDirection);
  const setPlanCamDirection = useStore((s) => s.setPlanCamDirection);
  const planCamFov = useStore((s) => s.planCamFov);
  const setPlanCamFov = useStore((s) => s.setPlanCamFov);
  const planCamFar = useStore((s) => s.planCamFar);
  const setPlanCamFar = useStore((s) => s.setPlanCamFar);
  const positions = usePosStore((s) => s.positions);
  const { settings } = useSettingsStore();

  // Create a Leva store & panel
  const plancamUIStore = useCreateStore();
  const [, set] = useControls(
    () => ({
      "On/Off": {
        value: planetCamera,
        onChange: setPlanetCamera,
      },
      Latitude: {
        value: planCamLat,
        max: 90,
        min: -90,
        step: 0.01,
        hint: "Camera latitude in decimal degrees",
        onChange: setPlanCamLat,
      },

      Longitude: {
        value: planCamLong,
        max: 180,
        min: -180,
        step: 0.1,
        hint: "Camera longitude in decimal degrees",
        onChange: setPlanCamLong,
      },
      "Height in km": {
        value: planCamHeight,
        min: 0,
        step: 10,
        hint: "Camera height in kilometers above planet center",
        onChange: setPlanCamHeight,
      },
      Angle: {
        value: planCamAngle,
        hint: "Camera angle/elevation",
        max: 90,
        min: -90,
        onChange: setPlanCamAngle,
      },
      Direction: {
        value: planCamDirection,
        hint: "Camera direction/azimuth",
        max: 360,
        min: 0,
        onChange: setPlanCamDirection,
      },
      "Field of view": {
        value: planCamFov,
        hint: "Camera field of view",
        max: 120,
        min: 1,
        onChange: setPlanCamFov,
      },
      "Viewing dist in Ly": {
        value: planCamFar,
        hint: "Camera viewing distance in light years",
        max: 500,
        min: 0.01,
        step: 0.01,
        onChange: setPlanCamFar,
      },
    }),
    { store: plancamUIStore }
  );

  //Set touch action to none so useGesture doesn't complain
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvasRef.current = canvas;
      canvas.style.touchAction = "none";
    }
  }, []);

  // //Set touch action to none so useGesture doesn't complain
  // gl.domElement.style.touchAction = "none";
  useGesture(
    {
      onDrag: planetCamera //If planetCamera is true, then we hand it a function
        ? ({ delta: [dx, dy] }) => {
            //Multiplute by fov to make the movement less sensitive when we're zoomed in
            // const sensitivity = 0.0001 * planetCamRef.current.fov;
            // planetCamRef.current.rotation.y += dx * sensitivity;
            // let camRotationX =
            //   planetCamRef.current.rotation.x + dy * sensitivity;
            // if (camRotationX > Math.PI / 2) camRotationX = Math.PI / 2;
            // if (camRotationX < -Math.PI / 2) camRotationX = -Math.PI / 2;
            // planetCamRef.current.rotation.x = camRotationX;
            // camBoxRef.current.rotation.y = planetCamRef.current.rotation.y;
            // camBoxRef.current.rotation.x = planetCamRef.current.rotation.x;
            // saveCameraPosition();

            //Multiplute by fov to make the movement less sensitive when we're zoomed in
            const sensitivity = 0.002 * planCamFov;

            const angle = planCamAngle + dy * sensitivity;
            if (angle <= 90 && angle >= -90) {
              setPlanCamAngle(angle);
              set({ Angle: angle });
            }
            let direction = planCamDirection - dx * sensitivity;
            if (direction > 360) direction -= 360;
            if (direction < 0) direction += 360;
            setPlanCamDirection(direction);
            set({ Direction: direction });
          }
        : () => {}, // and if not, it gets and empty function

      onWheel: planetCamera
        ? ({ delta: [, dy] }) => {
            //
            // const sensitivity = 0.01;
            // const fov = planetCamRef.current.fov + dy * sensitivity;
            // if (fov > 0 && fov < 120) {
            //   planetCamRef.current.fov = fov;
            //   planetCamRef.current.updateProjectionMatrix();
            // }
            // saveCameraPosition();

            const sensitivity = 0.02;
            const fov = planCamFov + dy * sensitivity;
            if (fov <= 120 && fov >= 1) {
              setPlanCamFov(fov);
              set({ "Field of view": fov });
            }
          }
        : () => {},
    },
    {
      target: canvasRef.current,
      eventOptions: { passive: false },
    }
  );

  // Update Leva controls when camera pos changes
  useEffect(() => {
    // console.log(planetCameraDirection.latRotationx);
    // set({ Latitude: rad2lat(latRotationx) });
    // set({ Longitude: rad2lon(longRotationy) });
    // set({ Height: height });
    // set({ Angle: camRotationx * (180 / Math.PI) });
    // set({ Direction: radiansToAzimuth(-camRotationy + Math.PI / 2) });
    // set({ FOV: camFov });
  }, [planetCameraDirection]);

  return (
    <>
      {planetCameraHelper && (
        <div className="plancam-div">
          <Leva
            store={plancamUIStore}
            titleBar={{ drag: true, title: "Planet camera", filter: false }}
            fill={false}
            hideCopyButton
            theme={{
              sizes: {
                // controlWidth: "70%", // or specific pixel value like '200px'
                numberInputMinWidth: "60px", // specifically for number inputs
              },

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
