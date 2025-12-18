import React, { useState, useEffect } from "react";
import { TextureLoader } from "three";
import * as THREE from "three";

export default function useTextureLoader(textureUrl) {
  const [texture, setTexture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: Ensure path is correct for Electron (production) vs Dev (localhost)
    // If textureUrl starts with '/', prepend PUBLIC_URL to make it relative to index.html
    const isAbsolute = textureUrl.startsWith('http') || textureUrl.startsWith('data:');
    
    const finalUrl = isAbsolute 
      ? textureUrl 
      : (process.env.PUBLIC_URL || '.') + (textureUrl.startsWith('/') ? '' : '/') + textureUrl;

    const loader = new TextureLoader();
    loader.load(
      finalUrl, // Use the corrected URL
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
        setIsLoading(false);
      },
      undefined, // onProgress (optional)
      (error) => {
        console.error(`Error loading ${finalUrl}:`, error);
        setIsLoading(false);
      }
    );
  }, [textureUrl]);

  return { texture, isLoading };
}