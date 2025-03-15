import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useStore } from "../store";
import changeZoom from "../utils/changeZoom"

const UIZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(80); // Initial zoom
  // const {zoomLevel, zoomIn, zoomOut} = useStore();

  const zoomIn = () => {
    setZoomLevel((prev) => prev + 10); // Increase by 10%
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(0.5, prev - 10)); // Decrease by 10%, min 50%
  };

  // console.log(zoomLevel)

// Apply zoom to the root element
// useEffect(() => {
//   const rootElement = document.getElementById("zoomable");
//   if (rootElement) {
//     rootElement.style.transform = `scale(${zoomLevel})`;
//     rootElement.style.transformOrigin = "top left";
//   }
// }, [zoomLevel]);

useEffect(()=>{
  changeZoom(zoomLevel)
}, [zoomLevel])

  return (
    <>
      <button className="menu-button menu-header-button" onClick={zoomOut}>
        <FaMinus />
      </button>
      <button className="menu-button menu-header-button" onClick={zoomIn}>
        <FaPlus />
      </button>{" "}
    </>
  );
};

export default UIZoom;
