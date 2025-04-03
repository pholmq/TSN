import { useRef } from "react";
import { useGesture } from "@use-gesture/react";
import { useThree } from "@react-three/fiber";
import useKeyPress from "../../utils/useKeyPress";
import { useStore } from "../../store";
import useFrameInterval from "../../utils/useFrameInterval";

export function PlanetCameraControls() {
  const { gl } = useThree();
  const keyPressed = useKeyPress();
  const planetCamera = useStore((s) => s.planetCamera);

  gl.domElement.style.touchAction = "none";

  const prevDirection = useRef(useStore.getState().planetCameraDirection);

  useGesture(
    {
      onDrag: planetCamera
        ? ({ delta: [dx, dy] }) => {
            const { planetCameraDirection } = useStore.getState();
            const sensitivity = 0.0001 * planetCameraDirection.camFov;
            const camRotationy =
              planetCameraDirection.camRotationy + dx * sensitivity;
            let camRotationx =
              planetCameraDirection.camRotationx + dy * sensitivity;
            if (camRotationx > Math.PI / 2) camRotationx = Math.PI / 2;
            if (camRotationx < -Math.PI / 2) camRotationx = -Math.PI / 2;

            useStore.setState({
              planetCameraDirection: {
                ...planetCameraDirection,
                camRotationy,
                camRotationx,
              },
            });
          }
        : () => {},

      onWheel: planetCamera
        ? ({ delta: [, dy] }) => {
            const { planetCameraDirection } = useStore.getState();
            const sensitivity = 0.01;
            const fov = planetCameraDirection.camFov + dy * sensitivity;
            if (fov > 0 && fov < 120) {
              useStore.setState({
                planetCameraDirection: {
                  ...planetCameraDirection,
                  camFov: fov,
                },
              });
            }
          }
        : () => {},
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
    }
  );

  useFrameInterval(() => {
    if (!keyPressed) return;

    const { planetCameraDirection } = useStore.getState();
    let { latRotationx, longRotationy, height } = planetCameraDirection;

    let heightFact = 0.2;
    if (height > 0.01) heightFact = 0.02 * height;

    switch (keyPressed) {
      case "w":
        latRotationx += 0.005;
        break;
      case "s":
        latRotationx -= 0.005;
        break;
      case "a":
        longRotationy -= 0.005;
        break;
      case "d":
        longRotationy += 0.005;
        break;
      case "q":
        height += 0.1;
        break;
      case "e":
        if (height >= 0) height -= 0.1;
        if (height < 0) height = 0;
        break;
    }

    if (latRotationx > 0) latRotationx = 0;
    if (latRotationx < -Math.PI) latRotationx = -Math.PI;

    useStore.setState({
      planetCameraDirection: {
        ...planetCameraDirection,
        latRotationx,
        longRotationy,
        height,
      },
    });
  });

  return null;
}
