import { useFrame, useThree } from "@react-three/fiber";
import { useLabelStore } from "./labelStore";

const LabelManager = () => {
  const { camera } = useThree();
  const updateLabelVisibility = useLabelStore(state => state.updateLabelVisibility);
  
  useFrame(() => {
    updateLabelVisibility(camera);
  });

  return null;
};

export default LabelManager;