import { useFrame, useThree } from "@react-three/fiber";
import { useLabelStore } from "./labelStore";

const LabelsManager = () => {
  const { camera } = useThree();
  const checkOverlaps = useLabelStore((s) => s.checkOverlaps);

  useFrame(() => {
    checkOverlaps(camera);
  }, -1);

  return null;
};

export default LabelsManager;