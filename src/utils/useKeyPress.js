import { useState, useEffect } from "react";

export default function useKeyPress() {
  const [keyPressed, setKeyPressed] = useState(null);

  useEffect(() => {
    const downHandler = (event) => {
      setKeyPressed(event.key);
    };

    const upHandler = () => {
      setKeyPressed(null);
    };

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);

    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

  return keyPressed;
}
