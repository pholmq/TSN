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
  const planetRadiusInUnits = planetSettings?.actualSize || 0.00426;
  const planetRadiusKm = unitsToKm(planetRadiusInUnits);
  const surfaceHeight = planCamHeight - planetRadiusKm;

  const plancamUIStore = useCreateStore();
  const isUpdatingFromCity = useRef(false);

  // Calculate zoom from FOV
  const planCamZoom = 121 - planCamFov;
  const setPlanCamZoom = (zoomValue) => {
    setPlanCamFov(121 - zoomValue);
  };

  // Define locations for each planet
  const locationsByPlanet = {
    Earth: {
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
    },

    Moon: {
      "-": { lat: null, long: null },

      "Tycho Crater": { lat: -43.31, long: -11.36 },
      "Copernicus Crater": { lat: 9.62, long: -20.08 },
      "Mare Tranquillitatis": { lat: 8.5, long: 31.4 },
      "South Pole": { lat: -89.9, long: 0 },
    },

    Mars: {
      "-": { lat: null, long: null },
      "Olympus Mons": { lat: 18.65, long: -133.8 },
      "Valles Marineris": { lat: -13.9, long: -59.2 },
      "Curiosity Rover": { lat: -4.59, long: 137.44 },
      "Perseverance Rover": { lat: 18.45, long: 77.45 },
      "Jezero Crater": { lat: 18.38, long: 77.58 },
      "Gale Crater": { lat: -5.4, long: 137.8 },
      "Hellas Basin": { lat: -42.4, long: 70.5 },
      "Tharsis Region": { lat: 0, long: -110 },
    },

    Mercury: {
      "-": { lat: null, long: null },
      "Caloris Basin": { lat: 30.5, long: -170 },
      "Beethoven Basin": { lat: -20.3, long: -124 },
    },

    Venus: {
      "-": { lat: null, long: null },
      "Maxwell Montes": { lat: 65.2, long: 3.3 },
      "Aphrodite Terra": { lat: -5, long: 105 },
    },

    Sun: {
      "-": { lat: null, long: null },
      Equator: { lat: 0, long: 0 },
      "North Pole": { lat: 89, long: 0 },
    },
  };

  // Get locations for current planet
  const cities = locationsByPlanet[planetCameraTarget] || {
    "-": { lat: null, long: null },
  };

  const [, set] = useControls(
    () => ({
      Planet: {
        value: planetCameraTarget,
        options: ["Earth", "Moon", "Mars", "Sun", "Mercury", "Venus"],
        onChange: setPlanetCameraTarget,
      },
      Ground: { value: showGround, onChange: setShowGround },
      Location: {
        value: "-",
        options: Object.keys(cities),
        onChange: (cityName) => {
          const city = cities[cityName];
          // Add safety check
          if (city && city.lat !== null && city.long !== null) {
            isUpdatingFromCity.current = true;
            setPlanCamLat(city.lat);
            setPlanCamLong(city.long);
            set({ Latitude: city.lat, Longitude: city.long });
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
          if (!isUpdatingFromCity.current) {
            set({ Location: "-" });
          }
        },
      },
      "Height (km)": {
        value: surfaceHeight,
        hint: "Height above planet surface in km",
        max: 10000,
        min: 0,
        step: 1,
        onChange: (value) => setPlanCamHeight(value + planetRadiusKm),
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
    }),
    { store: plancamUIStore },
    [planetRadiusKm, surfaceHeight, planetCameraTarget]
  );

  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvasRef.current = canvas;
      canvas.style.touchAction = "none";
    }
  }, []);

  useGesture(
    {
      onDrag: planetCamera
        ? ({ delta: [dx, dy] }) => {
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
        : () => {},

      onWheel: planetCamera
        ? ({ delta: [, dy] }) => {
            const sensitivity = 0.02;
            const newZoom = planCamZoom - dy * sensitivity;
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
                numberInputMinWidth: "60px",
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
