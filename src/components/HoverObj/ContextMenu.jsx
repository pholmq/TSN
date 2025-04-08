import { useEffect } from "react";
import { Html } from "@react-three/drei";
import { useStore } from "../../store"; // Adjust path

function distanceFromHtmlElement(element, mouseX, mouseY) {
  const rect = element.getBoundingClientRect();
  const elementCenterX = rect.left + rect.width / 2;
  const elementCenterY = rect.top + rect.height / 2;
  const distanceX = mouseX - elementCenterX;
  const distanceY = mouseY - elementCenterY;
  return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
}

const ContextMenu = ({ setContextMenu, pinned, setPinned, s }) => {
  const setCameraTarget = useStore((state) => state.setCameraTarget);

  const handleMouseMove = (e) => {
    const element = document.getElementById("ContextMenu");
    if (element) {
      const distance = distanceFromHtmlElement(element, e.clientX, e.clientY);
      if (distance > 200) {
        setContextMenu(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [setContextMenu]);

  return (
    <Html position={[0, 0, 0]} style={{ pointerEvents: "auto" }}>
      <div
        id="ContextMenu"
        className="info-panel"
        style={{ transform: "translateX(-60%)" }}
      >
        <div className="menu-item">
          <label className="menu-label-centered" style={{ fontWeight: "bold" }}>
            {s.name}{" "}
            <span dangerouslySetInnerHTML={{ __html: s.unicodeSymbol }} />
          </label>
        </div>
        <div className="menu-item">
          <button
            className="menu-button"
            onClick={() => setCameraTarget(s.name)}
          >
            Center camera
          </button>
        </div>
        <div className="menu-item">
          <button
            className="menu-button"
            onClick={() => {
              setPinned(!pinned);
              setContextMenu(false);
            }}
          >
            {pinned ? "Unpin info" : "Pin Info"}
          </button>
        </div>
      </div>
    </Html>
  );
};

export default ContextMenu;
