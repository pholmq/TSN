import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useStore } from "../store";
import changeZoom from "../utils/changeZoom";

const UIZoom = () => {
  // const [zoomLevel, setZoomLevel] = useState(80); // Initial zoom
  // // const {zoomLevel, zoomIn, zoomOut} = useStore();
  const { zoomLevel, zoomIn, zoomOut } = useStore();

  useEffect(() => {
    changeZoom(zoomLevel);
  }, [zoomLevel]);

  return (
    <>
      {/* <button
        className="menu-button menu-header-button"
        onClick={zoomOut}
        title={`Zoom: ${zoomLevel}%`}
      >
        <FaMinus />
      </button>
      <button
        className="menu-button menu-header-button"
        onClick={zoomIn}
        title={`Zoom: ${zoomLevel}%`}
      >
        <FaPlus />
      </button>{" "} */}
    </>
  );
};

export default UIZoom;
