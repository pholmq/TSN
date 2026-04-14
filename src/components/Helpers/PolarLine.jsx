import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useStore, useSettingsStore } from "../../store";

export default function PolarLine({ visible, name }) {
  const polarLineSize = useStore((s) => s.polarLineSize);

  // We no longer need the global southLine state
  const planetSetting = useSettingsStore((s) => s.getSetting(name));
  const showPolarLine = planetSetting?.polarLineVisible || false;

  const northPoints = useMemo(
    () => [
      [0, 0, 0],
      [0, polarLineSize, 0],
    ],
    [polarLineSize]
  );
  const southPoints = useMemo(
    () => [
      [0, -polarLineSize, 0],
      [0, 0, 0],
    ],
    [polarLineSize]
  );

  if (!visible || !showPolarLine) return null;

  return (
    <>
      <Line
        points={northPoints}
        color="red"
        lineWidth={1.5}
        raycast={() => null}
      />
      {/* Removed the conditional check so this always renders with the north line */}
      <Line
        points={southPoints}
        color="white"
        lineWidth={1.5}
        raycast={() => null}
      />
    </>
  );
}
