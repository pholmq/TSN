import { Html } from "@react-three/drei";
import { useStore } from "../store";
import { useRef } from "react";

const NameLabel = ({ s }) => {
  const showLables = useStore((s) => s.showLables);

  const portalRef = useRef(document.body);

  return (
    <Html
      visible={showLables}
      portal={{ current: portalRef.current }} // Render in body to avoid scaling issues
    >
      <div
        className="name-label"
        style={{ transform: "translateX(-55%) translateY(-150%)" }}
      >
        <span>{s.name}</span>
      </div>
    </Html>
  );
};

export default NameLabel;
