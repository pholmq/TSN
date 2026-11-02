import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useObserverStore } from "./observerStore";
import { kmToUnits } from "../../utils/celestial-functions";
import createCircleTexture from "../../utils/createCircleTexture";

const REFERENCE_COLOR = "#ff2020";

export default function ObserverReferenceMarker() {
  const reference = useObserverStore((s) => s.referenceGlobalPosition);
  const seeds = useObserverStore((s) => s.seeds);
  const texture = useMemo(() => createCircleTexture(REFERENCE_COLOR), []);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: texture,
        color: REFERENCE_COLOR,
        transparent: true,
        depthTest: false,
        sizeAttenuation: false,
      }),
    [texture]
  );

  useEffect(
    () => () => {
      material.dispose();
      texture.dispose();
    },
    [material, texture]
  );

  const markers = [
    ...(reference ? [{ id: "reference", position: reference }] : []),
    ...seeds,
  ];

  if (markers.length === 0) return null;

  return (
    <group>
      {markers.map((marker) => {
        const position = marker.position;
        return (
          <sprite
            key={marker.id}
            position={[
              kmToUnits(position.x),
              kmToUnits(position.y),
              kmToUnits(position.z),
            ]}
            material={material}
            scale={[0.0015, 0.0015, 0.0015]}
            renderOrder={1001}
            raycast={() => null}
          />
        );
      })}
    </group>
  );
}
