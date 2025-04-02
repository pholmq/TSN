import { useStore } from "../../store";

export default function PlanetCameraUI() {
  const planetCamera = useStore((s) => s.planetCamera);

  return (
    <>
      {planetCamera && (
        <div className="plancam-div">
          <div className="menu">
            <div className="menu-item">
              <label className="menu-label">Planet camera</label>
            </div>
            <div className="menu-item">
              <label className="menu-label">Latitude: </label>
              <input
                className="menu-input"
                // ref={dateRef}
                // onKeyDown={dateKeyDown}
                // onBlur={() => (dateRef.current.value = posToDate(posRef.current))}
              />
            </div>
            <div className="menu-item">
              <label className="menu-label">Longitude: </label>
              <input
                className="menu-input"
                // ref={dateRef}
                // onKeyDown={dateKeyDown}
                // onBlur={() => (dateRef.current.value = posToDate(posRef.current))}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
