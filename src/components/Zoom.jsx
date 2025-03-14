import React from 'react';
import useZoomStore from './zoomStore';
import ZoomButtons from './ZoomButtons';
import './ZoomRoot.css';

const ZoomRoot = ({ children }) => {
  const zoomLevel = useZoomStore((state) => state.zoomLevel);

  return (
    <>
      <ZoomButtons /> {/* Buttons outside scaled content */}
      <div
        id="root"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          height: '100%',
          width: '100%',
        }}
      >
        {children} {/* Render app content */}
      </div>
    </>
  );
};

export default ZoomRoot;