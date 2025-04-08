import { useRef, useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useStore } from "../../store";
import ContextMenu from "./ContextMenu";
import { getRaDecDistance } from "../../utils/celestial-functions";

const HoverPanel = ({ hovered, contextMenu, setContextMenu, s }) => {
  const { scene } = useThree();
  const raRef = useRef(null);
  const decRef = useRef(null);
  const distRef = useRef(null);
  const eloRef = useRef(null);
  const intervalRef = useRef(null);
  const [pinned, setPinned] = useState(false);
  const setCameraTarget = useStore((state) => state.setCameraTarget);

  function update() {
    if (!raRef.current) return;
    // if (s.type === "star") {
      if (false) {
        raRef.current.value = s.ra;
      decRef.current.value = s.dec;
      console.log(s.name+" s.dec" + s.dec)
      distRef.current.value = s.dist;
      eloRef.current.value = "-"
    } else {
      const { ra, dec, elongation, dist } = getRaDecDistance(s.name, scene);
      raRef.current.value = ra;
      decRef.current.value = dec;
      distRef.current.value = dist;
      eloRef.current.value =
        isNaN(elongation) || Number(elongation) === 0 ? "-" : elongation;
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
    <>
      {contextMenu && (
        <ContextMenu
          setContextMenu={setContextMenu}
          pinned={pinned}
          setPinned={setPinned}
          s={s}
        />
      )}
      {showPanel && (
        <Html position={[0, 0, 0]} style={{ pointerEvents: "auto" }}>
          <div
            className="info-panel"
            style={{ transform: "translateX(-60%)" }}
            onContextMenu={(e) => {
              if (pinned) {
                e.preventDefault();
                setContextMenu(true);
              }
            }}
            onDoubleClick={() => setCameraTarget(s.name)}
          >
            <div className="menu-item">
              <label
                className="menu-label-centered"
                style={{ fontWeight: "bold" }}
              >
                {s.name}{" "}
                <span dangerouslySetInnerHTML={{ __html: s.unicodeSymbol }} />
              </label>
            </div>
            <div className="menu-item">
              <label className="menu-label">RA:</label>
              <input className="menu-input" ref={raRef} />
            </div>
            <div className="menu-item">
              <label className="menu-label">Dec:</label>
              <input className="menu-input" ref={decRef} />
            </div>
            <div className="menu-item">
              <label className="menu-label">Dist:</label>
              <input className="menu-input" ref={distRef} />
            </div>
            <div className="menu-item">
              <label className="menu-label">Elongation:</label>
              <input className="menu-input" ref={eloRef} />
            </div>
            <div className="menu-item">
              <label className="menu-label-centered">
                Doubleclick - Center cam. <br /> Right click - Menu.
              </label>
            </div>
          </div>
        </Html>
      )}
    </>
  );
};

export default HoverPanel;
