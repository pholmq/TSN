import { useEffect, useLayoutEffect, useRef } from "react";
import { usePosStore } from "../store";

export default function PosInfo() {
  const trackedObjects = usePosStore((s) => s.trackedObjects);
  // console.log("Pos<info");
  // console.log(trackedObjects);
  return (
    <>
      <p className="">Positions</p>

      {trackedObjects.map((item, index) => (
        <Position key={index} name={item} />
      ))}
    </>
  );
}

function Position({ name }) {
  const raRef = useRef(null);
  const decRef = useRef(null);
  const distRef = useRef(null);
  const eloRef = useRef(null);
  const positions = usePosStore((s) => s.positions);
  useEffect(() => {
    // console.log(positions)
    const { [name]: position } = positions;
    if (!position) return;
    const { ra, dec, elongation, dist } = position;
    raRef.current.value = ra;
    decRef.current.value = dec;
    distRef.current.value = dist;
    eloRef.current.value = elongation;
  }, [positions]);

  return (
    <>
      <div>
        {name}
        <div className="menu-item">
          <label className="menu-label">RA:</label>
          <input className="menu-input" ref={raRef} />
        </div>
        <div className="menu-item">
          <label className="menu-label">Dec:</label>
          <input className="menu-input" ref={decRef} />
        </div>
        <div className="menu-item">
          <label className="menu-label">Dist:</label>
          <input className="menu-input" ref={distRef} />
        </div>
        <div className="menu-item">
          <label className="menu-label">Elongation:</label>
          <input className="menu-input" ref={eloRef} />
        </div>
      </div>
    </>
  );
}
