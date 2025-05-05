import { useRef, useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useStore } from "../../store";
import { Vector3 } from "three";
import ContextMenu from "./ContextMenu";
import { getRaDecDistance } from "../../utils/celestial-functions";

const HoverPanel = ({ hovered, contextMenu, setContextMenu, s }) => {
  const { scene, camera, viewport } = useThree();
  const raRef = useRef(null);
  const decRef = useRef(null);
  const distRef = useRef(null);
  const eloRef = useRef(null);
  const intervalRef = useRef(null);
  const [pinned, setPinned] = useState(false);
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const setHoveredObjectId = useStore((state) => state.setHoveredObjectId);

  const groupRef = useRef(null);

  function update() {
    if (!raRef.current) return;

    const { ra, dec, elongation, dist } = getRaDecDistance(s.name, scene);
    raRef.current.value = ra;
    decRef.current.value = dec;
    distRef.current.value = dist;
    eloRef.current.value =
      isNaN(elongation) || Number(elongation) === 0 ? "-" : elongation;
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

  const portalRef = useRef(document.body);

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
        <Html
          portal={{ current: portalRef.current }} // Explicitly target <body>. Solves the issue with the html being positioned wrong when scaled
        >
          <div
            className="info-panel"
            style={{ transform: "translateX(-60%)" }}
            onContextMenu={(e) => {
              if (pinned) {
                e.preventDefault();
                setHoveredObjectId(s.name);
                setContextMenu(true);
              }
            }}
            onDoubleClick={() => setCameraTarget(s.name)}
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
              <label className="menu-label">Dist:</label>
              <input className="menu-input" ref={distRef} disabled />
            </div>
            <div className="panel-item">
              <label className="menu-label">Elongation:</label>
              <input className="menu-input" ref={eloRef} disabled />
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
