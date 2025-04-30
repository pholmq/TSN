import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useStore } from "../../store";
import { useRef } from "react";

const NameLabel = ({ s }) => {
  const showLabels = useStore((s) => s.showLabels);
  const runIntro = useStore((s) => s.runIntro);

  const portalRef = useRef(document.body);
  const labelRef = useRef();

  //   useFrame((state, delta) => {
  //     if (!runIntro) return;
  //     if (labelRef.current) {
  //       if (labelRef.current.style.opacity <= 0.8) {
  //         labelRef.current.style.opacity += 0.1;
  //         // Fade in slowly
  //       } else {
  //         setRunIntro(false);
  //       }
  //     }
  //   });

  return (
    // Hide lables while intro is running
    !runIntro && showLabels ? (
      <Html
        visible={showLabels}
        portal={{ current: portalRef.current }} // Render in body to avoid scaling issues
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={labelRef}
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
