import { Html } from "@react-three/drei";
import { useStore } from "../../store";
import { useRef, useState, useEffect } from "react";

const IntroQuote = ({ duration = 10000, fade = 2000 }) => {
  const runIntro = useStore((s) => s.runIntro);
  const showMenu = useStore((s) => s.showMenu);
  const portalRef = useRef(document.body);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Quotes with typographic quotes + author included
  const quotes = [
    {
      text: "“Those who study the stars have God for a teacher.” — Tycho Brahe",
    },
    {
      text: "“So mathematical truth prefers simple words since the language of truth is itself simple.” — Tycho Brahe",
    },
    {
      text: "“An astronomer must be cosmopolitan, because ignorant statesmen cannot be expected to value their services.” — Tycho Brahe",
    },
    {
      text: "“There is something eccentric in the orbit of Mars.” — Tycho Brahe",
    },
    {
      text: "“The skies are a canvas, displaying the beauty of creation. We must strive to capture its essence.” — Tycho Brahe",
    },
    {
      text: "“Astronomy is a bridge between the earthly and the divine. Through it, we can glimpse the harmony of the cosmos.” — Tycho Brahe",
    },
    {
      text: "“The heavens are like an intricate tapestry, woven with threads of mystery. We must unravel its patterns.” — Tycho Brahe",
    },
    {
      text: "“The universe is a symphony of light and darkness. We must embrace both to understand its symphony.” — Tycho Brahe",
    },
    {
      text: "“The path to enlightenment is paved with celestial wonders. We must follow it relentlessly.” — Tycho Brahe",
    },
  ];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex].text);

    const fadeInTimer = setTimeout(() => setIsVisible(true), 100);
    const fadeOutTimer = setTimeout(() => setIsVisible(false), duration - fade);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [duration, fade]);

  if (!runIntro) {
    return null;
  }

  return (
    <Html
      portal={{ current: portalRef.current }}
      style={{ pointerEvents: "none" }}
    >
      <div
        className="name-label"
        style={{
          transform: "translateX(-50%) translateY(-40vh)",
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${fade}ms ease-in-out`,
          fontFamily: "'Times New Roman', serif",
          fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
          fontWeight: "400",
          textAlign: "center",
          color: "grey",
          textShadow: "2px 2px 6px rgba(0,0,0,0.7)",
          width: `min(800px, 90vw)`,
          padding: "0 20px",
          whiteSpace: "normal",
          wordWrap: "break-word",
          lineHeight: "1.4",
        }}
      >
        {currentQuote}
      </div>
    </Html>
  );
};

export default IntroQuote;
