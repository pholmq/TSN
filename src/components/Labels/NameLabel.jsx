import { Html } from "@react-three/drei";
import { useStore } from "../../store";
import { useLabelStore } from "./labelStore";

import { useRef, useEffect } from "react";

const NameLabel = ({ s }) => {
  const showLabels = useStore((s) => {
    return s.showLabels;
  });
  const registerLabel = useLabelStore((s) => s.registerLabel);
  const unregisterLabel = useLabelStore((s) => s.unregisterLabel);
  const portalRef = useRef(document.body);
  const divRef = useRef();

  useEffect(() => {
    if (divRef.current) {
      registerLabel(s.name, divRef, s);
    }
    return () => unregisterLabel(s.name);
  }, [s, registerLabel, unregisterLabel]);

  return (
    <Html
      visible={showLabels}
      portal={{ current: portalRef.current }}
      position={s.position}
    >
      <div
        ref={divRef}
        className="name-label"
        style={{
          transform: "translateX(-55%) translateY(-150%)",
          display: showLabels ? "block" : "none",
        }}
      >
        <span>{s.name}</span>
      </div>
    </Html>
  );
};

export default NameLabel;
