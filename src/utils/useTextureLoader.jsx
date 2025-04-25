import React, { useState, useEffect } from "react";
import { TextureLoader } from "three";
import * as THREE from "three"; // Import Three.js for constants

// Custom hook for loading textures
export default function useTextureLoader(textureUrl) {
  const [texture, setTexture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      textureUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
        setIsLoading(false);
      },

      (error) => {
        console.error(`Error loading ${textureUrl}:`, error);
        setIsLoading(false);
      }
    );
  }, [textureUrl]);

  return { texture, isLoading };
}
