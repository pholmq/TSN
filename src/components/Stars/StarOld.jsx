// Star.js
import { SpriteMaterial } from "three";
import { useStarStore } from "../../store"; 
import createCircleTexture from "../../utils/createCircleTexture"; 

const Star = ({ name }) => {
  const { settings } = useStarStore();
  const s = settings.find((p) => p.name === name);

  const circleTexture = createCircleTexture(s.color);

  const spriteMaterial = new SpriteMaterial({
    map: circleTexture,
    transparent: true,
    opacity: 1,
    sizeAttenuation: false,
    depthTest: false,
    color: s.color,
  });

  const size = s.size;

  return (
    <sprite
      material={spriteMaterial}
      scale={[size, size, size]}
      renderOrder={1}
    />
  );
};

export default Star;