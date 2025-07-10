import { useState, useRef } from "react";
import { Html } from "@react-three/drei";
import BSCStars from "./BSCStars";

export default function BSCStarsHandler() {
  const [hoverData, setHoverData] = useState(null);
  const portalRef = useRef(document.body);
  //portal={{ current: portalRef.current }} => Render in bod to avoid scaling issues
  return (
    <>
      <BSCStars
        onStarClick={({ star, position, index }) => {
          // console.log("Clicked star:", star.name, "at position:", position);
        }}
        onStarHover={(data, event) => {
          if (data) {
            console.log(data);
            // console.log("Hovering over:", data.star.name);
            console.log(event.clientX);
            setHoverData({
              star: data.star,
              position: { x: event.clientX, y: event.clientY },
            });
          } else {
            // console.log("No star hovered");
            setHoverData(null);
          }
        }}
      />
      {hoverData && (
        <Html portal={{ current: portalRef.current }}>
          <div
            style={{
              position: "absolute",
              backgroundColor: "#1f2937",
              color: "#ffffff",
              padding: "16px",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 10,
              maxWidth: "300px",
              left: "0px", // Top-left corner
              top: "0px", // Top-left corner
              // left: `${hoverData.position.x}px`, // Mouse X (screen coords)
              // top: `${hoverData.position.y}px`, // Below mouse (20px offset)
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              {hoverData.star.name}
            </h3>
            <p style={{ margin: "4px 0", whiteSpace: "nowrap" }}>
              RA: {hoverData.star.ra}
            </p>
            <p style={{ margin: "4px 0" }}>Dec: {hoverData.star.dec}</p>
            <p style={{ margin: "4px 0" }}>Magnitude: {hoverData.star.mag}</p>
            <p style={{ margin: "4px 0" }}>Distance: {hoverData.star.dist}</p>
          </div>
        </Html>
      )}
    </>
  );
}
