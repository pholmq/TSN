import { useEffect, useRef } from "react";
import { useControls, Leva, useCreateStore } from "leva";
import { useGesture } from "@use-gesture/react";
import { useStore, useSettingsStore } from "../../store";
import { usePlanetCameraStore } from "./planetCameraStore";
import { unitsToKm } from "../../utils/celestial-functions";

const PlanetCameraUI = () => {
  const planetCamera = useStore((s) => s.planetCamera);
  const planetCameraTarget = usePlanetCameraStore((s) => s.planetCameraTarget);
  const setPlanetCameraTarget = usePlanetCameraStore(
    (s) => s.setPlanetCameraTarget
  );
  const getSetting = useSettingsStore((s) => s.getSetting);

  const planCamLat = usePlanetCameraStore((s) => s.planCamLat);
  const setPlanCamLat = usePlanetCameraStore((s) => s.setPlanCamLat);
  const planCamLong = usePlanetCameraStore((s) => s.planCamLong);
  const setPlanCamLong = usePlanetCameraStore((s) => s.setPlanCamLong);
  const planCamHeight = usePlanetCameraStore((s) => s.planCamHeight);
  const setPlanCamHeight = usePlanetCameraStore((s) => s.setPlanCamHeight);
  const planCamAngle = usePlanetCameraStore((s) => s.planCamAngle);
  const setPlanCamAngle = usePlanetCameraStore((s) => s.setPlanCamAngle);
  const planCamDirection = usePlanetCameraStore((s) => s.planCamDirection);
  const setPlanCamDirection = usePlanetCameraStore(
    (s) => s.setPlanCamDirection
  );
  const planCamFov = usePlanetCameraStore((s) => s.planCamFov);
  const setPlanCamFov = usePlanetCameraStore((s) => s.setPlanCamFov);
  const planCamFar = usePlanetCameraStore((s) => s.planCamFar);
  const setPlanCamFar = usePlanetCameraStore((s) => s.setPlanCamFar);
  const showGround = usePlanetCameraStore((s) => s.showGround);
  const setShowGround = usePlanetCameraStore((s) => s.setShowGround);

  // Get planet radius and calculate surface height
  const planetSettings = getSetting(planetCameraTarget);
  const planetRadiusInUnits = planetSettings?.actualSize || 0.00426; // Default to Earth if not found
  const planetRadiusKm = unitsToKm(planetRadiusInUnits);
  console.log("planet camera ui: " + planetRadiusKm);
  const surfaceHeight = planCamHeight - planetRadiusKm;

  const plancamUIStore = useCreateStore();

  // Track if we're updating from a city selection
  const isUpdatingFromCity = useRef(false);

  // Calculate zoom from FOV (not stored in state)
  const planCamZoom = 121 - planCamFov;
  const setPlanCamZoom = (zoomValue) => {
    setPlanCamFov(121 - zoomValue);
  };

  // Major cities with their coordinates
  const cities = {
    "-": { lat: null, long: null },
    "Rome, Italy": { lat: 41.9, long: 12.5 },
    "Stockholm, Sweden": { lat: 59.33, long: 18.07 },
    "Paris, France": { lat: 48.86, long: 2.35 },
    "Berlin, Germany": { lat: 52.52, long: 13.41 },
    "London, UK": { lat: 51.51, long: -0.13 },
    "New York, USA": { lat: 40.71, long: -74.01 },
    "Tokyo, Japan": { lat: 35.68, long: 139.69 },
    "Sydney, Aus.": { lat: -33.87, long: 151.21 },
    "Mumbai, India": { lat: 19.08, long: 72.88 },
    "Beijing, China": { lat: 39.9, long: 116.41 },
    "Moscow, Russia": { lat: 55.76, long: 37.62 },
    "Cairo, Egypt": { lat: 30.04, long: 31.24 },
    "Rio de Jan., Brazil": { lat: -22.91, long: -43.17 },
    "Los Angeles, USA": { lat: 34.05, long: -118.24 },
    "Mexico City, Mexico": { lat: 19.43, long: -99.13 },
    "Istanbul, Turkey": { lat: 41.01, long: 28.98 },
    "Bangkok, Thailand": { lat: 13.76, long: 100.5 },
    "Singapore, Singap.": { lat: 1.35, long: 103.82 },
    "Hong Kong, China": { lat: 22.32, long: 114.17 },
    "Dubai, UAE": { lat: 25.2, long: 55.27 },
    "Cape Town, S.A.": { lat: -33.92, long: 18.42 },
    "Toronto, Canada": { lat: 43.65, long: -79.38 },
    "Buenos Aires, Arg.": { lat: -34.6, long: -58.38 },
    "Seoul, South Korea": { lat: 37.57, long: 126.98 },
    "Nairobi, Kenya": { lat: -1.29, long: 36.82 },
    "Reykjavik, Iceland": { lat: 64.15, long: -21.94 },
    "Athens, Greece": { lat: 37.98, long: 23.73 },
    "Wellington, N.Z.": { lat: -41.29, long: 174.78 },
    "Santiago, Chile": { lat: -33.45, long: -70.67 },
    "Anchorage, USA": { lat: 61.22, long: -149.9 },
  };

  const [, set] = useControls(
    () => ({
      Planet: {
        value: planetCameraTarget,
        options: ["Earth", "Moon", "Mars", "Sun", "Mercury", "Venus"], // or get from settings
        onChange: setPlanetCameraTarget,
      },
      Ground: { value: showGround, onChange: setShowGround },
      Location: {
        value: "-",
        options: Object.keys(cities),
        onChange: (cityName) => {
          const city = cities[cityName];
          if (city.lat !== null && city.long !== null) {
            // Set flag to indicate we're updating from city selection
            isUpdatingFromCity.current = true;
            // Update latitude and longitude
            setPlanCamLat(city.lat);
            setPlanCamLong(city.long);
            // Also update the Leva controls to reflect the new values
            set({ Latitude: city.lat, Longitude: city.long });
            // Reset flag after a short delay
            setTimeout(() => {
              isUpdatingFromCity.current = false;
            }, 100);
          }
        },
      },
      Latitude: {
        value: planCamLat,
        hint: "Latitude in degrees (-90 to 90)",
        max: 90,
        min: -90,
        step: 0.01,
        onChange: (v) => {
          setPlanCamLat(v);
          // Only reset city selection if this is a manual change
          if (!isUpdatingFromCity.current) {
            set({ Location: "-" });
          }
        },
      },
      Longitude: {
        value: planCamLong,
        hint: "Longitude in degrees (-180 to 180)",
        max: 180,
        min: -180,
        step: 0.01,
        onChange: (v) => {
          setPlanCamLong(v);
          // Only reset city selection if this is a manual change
          if (!isUpdatingFromCity.current) {
            set({ Location: "-" });
          }
        },
      },
      "Height (km)": {
        value: surfaceHeight, // Display height above surface
        hint: "Height above planet surface in km",
        max: 10000,
        min: 0,
        step: 1,
        onChange: (value) => setPlanCamHeight(value + planetRadiusKm), // Convert back to center height
      },
      Angle: {
        value: planCamAngle,
        hint: "Vertical viewing angle",
        max: 90,
        min: -90,
        step: 0.1,
        onChange: setPlanCamAngle,
      },
      Direction: {
        value: planCamDirection,
        hint: "Compass direction",
        max: 360,
        min: 0,
        step: 0.1,
        onChange: setPlanCamDirection,
      },
      Zoom: {
        value: planCamZoom,
        hint: "Zoom level",
        max: 120,
        min: 1,
        step: 0.1,
        onChange: (v) => {
          setPlanCamZoom(v);
        },
      },
      // "Viewing dist in Ly": {
      //   value: planCamFar,
      //   hint: "Camera viewing distance in light years",
      //   max: 500,
      //   min: 0.01,
      //   step: 0.01,
      //   onChange: setPlanCamFar,
      // },
    }),
    { store: plancamUIStore },
    [planetRadiusKm, surfaceHeight, planetCameraTarget]
  );

  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvasRef.current = canvas;
      //Set touch action to none so useGesture doesn't complain
      canvas.style.touchAction = "none";
    }
  }, []);

  useGesture(
    {
      onDrag: planetCamera //If planetCamera is true, then we hand it a function
        ? ({ delta: [dx, dy] }) => {
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
            const sensitivity = 0.02;
            const newZoom = planCamZoom - dy * sensitivity; // Changed from + to -
            if (newZoom <= 120 && newZoom >= 1) {
              setPlanCamZoom(newZoom);
              set({ Zoom: newZoom });
            }
          }
        : () => {},
    },
    {
      target: canvasRef.current,
      eventOptions: { passive: false },
    }
  );

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
