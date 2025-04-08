import { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { useStore } from "../../store"; // Adjust path

// Calculate distance the mouse has moved from an initial position
function distanceMouseMoved(initialX, initialY, currentX, currentY) {
  const deltaX = currentX - initialX;
  const deltaY = currentY - initialY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

const ContextMenu = ({ setContextMenu, pinned, setPinned, s }) => {
  const setCameraTarget = useStore((state) => state.setCameraTarget);
  const hoveredObjectId = useStore((state) => state.hoveredObjectId);
  const initialMousePos = useRef({ x: null, y: null }); // Store initial mouse position

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;

    // If this is the first movement after opening, set the initial position
    if (
      initialMousePos.current.x === null ||
      initialMousePos.current.y === null
    ) {
      initialMousePos.current = { x: clientX, y: clientY };
      return;
    }

    // Calculate how far the mouse has moved from the initial position
    const distance = distanceMouseMoved(
      initialMousePos.current.x,
      initialMousePos.current.y,
      clientX,
      clientY
    );

    // Hide the context menu if moved more than 200 pixels (adjust as needed)
    if (distance > 200) {
      setContextMenu(false);
    }
  };

  // Add and clean up the mousemove listener
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      // Reset initial position when the menu closes
      initialMousePos.current = { x: null, y: null };
    };
  }, [setContextMenu]);

  useEffect(() => {
    if (hoveredObjectId !== s.name) setContextMenu(false); //Hide the menu if another obj is hovered
  }, [hoveredObjectId]);

  const portalRef = useRef(document.body);

  return (
    <Html
      position={[0, 0, 0]}
      style={{ pointerEvents: "auto" }}
      portal={{ current: portalRef.current }} // Explicitly target <body>. Solves the issue with the html being positioned wrong when scaled
    >
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
