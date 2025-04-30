import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useStore } from "../../store";
import { useRef } from "react";

const NameLabel = ({ s }) => {
  const showLabels = useStore((s) => s.showLabels);
  const runIntro = useStore((s) => s.runIntro);

  const portalRef = useRef(document.body);

  return (
    // Hide lables while intro is running
    !runIntro && showLabels ? (
      <Html
        visible={showLabels}
        portal={{ current: portalRef.current }} // Render in body to avoid scaling issues
        style={{ pointerEvents: "none" }}
      >
        <div
          className="name-label"
          style={{ transform: "translateX(-55%) translateY(-170%)" }}
        >
          <span>{s.name}</span>
        </div>
      </Html>
    ) : null
  );
};

export default NameLabel;
