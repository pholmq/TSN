import { Html } from "@react-three/drei";
import { useStore } from "../../store";
import { useRef, useState, useEffect } from "react";

const IntroQuote = ({ duration = 10000, fade = 2000 }) => {
  const runIntro = useStore((s) => s.runIntro);
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
    {
      text: "“He who goes slowly goes safely — and goes far” — old Italian adage",
    },
    {
      text: "“Astronomy advances not by arbitrary fictions, but by numbers that are grounded in observation and confirmed by the harmony of the heavens.” — Christen Sørensen Longomontanus",
    },
    {
      text: "“Tycho Brahe left behind such ample and accurate observations, and from them may be established a system that truly reflects the order of the heavens.” — Christen Sørensen Longomontanus",
    },
    {
      text: "“The orbit of Mars is a faithful judge of the order of the spheres; no hypothesis that misplaces Mars can be in harmony with the observations.” — Christen Sørensen Longomontanus",
    },
    {
      text: "“Without geometry we cannot measure the heavens; without numbers we cannot express the motions; and without observation we cannot judge whether our geometry and numbers are true.” — Christen Sørensen Longomontanus",
    },
    {
      text: "“I have taken up the unfinished work of Tycho Brahe, that the system of the heavens, so carefully measured by him, might not remain hidden in scattered manuscripts.” — Christen Sørensen Longomontanus",
    },
    {
      text: "“Geometry is the language of the heavens; without it, the motions of the stars remain mute riddles.” — Christen Sørensen Longomontanus",
    },
    {
      text: "“When we behold the heavens, admire their order, and measure their motions, we turn them to the praise of the Creator and to the benefit of human life.” — Christen Sørensen Longomontanus",
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
          // Lowered the min font size from 2.5rem to 1.5rem for better narrow mobile fit
          fontSize: "clamp(1.5rem, 6vw, 3rem)",
          fontWeight: "400",
          textAlign: "center",
          color: "grey",
          textShadow: "2px 2px 6px rgba(0,0,0,0.7)",
          width: "90vw",
          maxWidth: "900px",
          boxSizing: "border-box", // Prevents padding from blowing out the viewport width
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
