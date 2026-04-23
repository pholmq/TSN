import { useRef, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useStore } from "../../store";
import ContextMenu from "./ContextMenu";
import { getRaDecDistance } from "../../utils/celestial-functions";

// Accept pinned and setPinned from parent
const HoverPanel = ({
  hovered,
  contextMenu,
  setContextMenu,
  pinned,
  setPinned,
  s,
}) => {
  const { scene } = useThree();
  const raRef = useRef(null);
  const decRef = useRef(null);
  const distRef = useRef(null);
  const eloRef = useRef(null);

  const orbSpeedRef = useRef(null);
  const absSpeedRef = useRef(null);
  const avgAbsSpeedRef = useRef(null);

  const intervalRef = useRef(null);

  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);
  const planetCamera = useStore((state) => state.planetCamera);

  const groupRef = useRef(null);
  const portalRef = useRef(document.body);

  function update() {
    if (!raRef.current) return;

    const { ra, dec, elongation, dist } = getRaDecDistance(s.name, scene);
    raRef.current.value = ra;
    decRef.current.value = dec;
    distRef.current.value = dist;
    eloRef.current.value = elongation;

    const target = scene.getObjectByName(s.name);
    if (target && target.userData.speeds) {
      if (orbSpeedRef.current) {
        orbSpeedRef.current.value = `${target.userData.speeds.orbital.toFixed(
          2
        )} km/s`;
      }
      if (absSpeedRef.current) {
        absSpeedRef.current.value = `${target.userData.speeds.absolute.toFixed(
          2
        )} km/s`;
      }
      if (avgAbsSpeedRef.current) {
        avgAbsSpeedRef.current.value = `${target.userData.speeds.avgAbsolute.toFixed(
          2
        )} km/s`;
      }
    }
  }

  useEffect(() => {
    if (hovered || pinned) {
      intervalRef.current = setInterval(update, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [hovered, pinned]);

  const showPanel = (hovered || pinned) && !contextMenu;

  return (
    <group ref={groupRef}>
      {contextMenu && (
        <ContextMenu
          setContextMenu={setContextMenu}
          pinned={pinned}
          setPinned={setPinned}
          s={s}
        />
      )}
      {showPanel && (
        <Html portal={{ current: portalRef.current }}>
          <div
            className="info-panel"
            style={{
              transform: "translateX(-60%) ",
              transformOrigin: "top left",
            }}
            onContextMenu={(e) => {
              if (pinned) {
                e.preventDefault();
                setHoveredObjectId(s.name);
                setContextMenu(true);
              }
            }}
            onDoubleClick={() => {
              if (!planetCamera) setCameraTarget(s.name);
            }}
          >
            <div className="panel-item">
              <label
                className="menu-label-centered"
                style={{ fontWeight: "bold" }}
              >
                {s.name}{" "}
                <span dangerouslySetInnerHTML={{ __html: s.unicodeSymbol }} />
              </label>
            </div>
            <div className="panel-item">
              <label className="menu-label">RA:</label>
              <input className="menu-input" ref={raRef} disabled />
            </div>
            <div className="panel-item">
              <label className="menu-label">Dec:</label>
              <input className="menu-input" ref={decRef} disabled />
            </div>
            <div className="panel-item">
              <label className="menu-label">Distance:</label>
              <input className="menu-input" ref={distRef} disabled />
            </div>
            <div className="panel-item">
              <label className="menu-label">Elongation:</label>
              <input className="menu-input" ref={eloRef} disabled />
            </div>

            <div className="panel-item">
              <label className="menu-label">Orbital Spd:</label>
              <input className="menu-input" ref={orbSpeedRef} disabled />
            </div>
            <div className="panel-item">
              <label className="menu-label">Abs. Spd:</label>
              <input className="menu-input" ref={absSpeedRef} disabled />
            </div>
            <div className="panel-item">
              <label className="menu-label">Avg Abs Spd:</label>
              <input className="menu-input" ref={avgAbsSpeedRef} disabled />
            </div>

            <div className="panel-item">
              <label className="menu-label-centered">
                Doubleclick - Center cam. <br /> Right click - Menu.
              </label>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default HoverPanel;
