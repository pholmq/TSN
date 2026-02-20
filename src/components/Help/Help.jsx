import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../store";
import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import helpContent from "./HelpContent.md";
import TychosLogoIcon from "../../utils/TychosLogoIcon";

// Clean geometric SVG of the TYCHOS model

const Help = () => {
  const showHelp = useStore((s) => s.showHelp);
  const setShowHelp = useStore((s) => s.setShowHelp);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [markdownContent, setMarkdownContent] = useState("");
  const helpRef = useRef(null);

  // Load markdown content
  useEffect(() => {
    fetch(helpContent)
      .then((response) => response.text())
      .then((text) => setMarkdownContent(text))
      .catch((error) => console.error("Error loading help content:", error));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition({
        x: position.x + deltaX,
        y: position.y + deltaY,
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const handleMouseDown = (e) => {
    // Only start dragging if clicking on the header area
    if (e.target.closest(".help-header")) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  if (!showHelp) return null;

  return createPortal(
    <div
      ref={helpRef}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        backgroundColor: "#111827",
        color: "white",
        padding: "0",

        borderRadius: "6px",
        opacity: 0.9,
        boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",

        zIndex: 2147483647,

        // --- Scaled down defaults ---
        width: "600px",
        height: "60vh",
        minWidth: "350px",
        minHeight: "250px",
        maxWidth: "90vw",
        maxHeight: "95vh",
        resize: "both",
        overflow: "hidden",

        display: "flex",
        flexDirection: "column",

        userSelect: isDragging ? "none" : "auto",
      }}
    >
      <div
        className="help-header"
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "28px",
          padding: "0 8px",
          backgroundColor: "#181c20",
          borderBottom: "1px solid #181c20",
          borderTopLeftRadius: "6px",
          borderTopRightRadius: "6px",
          cursor: isDragging ? "grabbing" : "grab",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Replaced <h2> with standard matching wrapper and added binary star symbol */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: "600",
              color: "white",
              pointerEvents: "none",
            }}
          >
            <TychosLogoIcon size={20} />
            The Tychosium
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div
              title="Learn about the TYCHOS model at www.tychos.space"
              onClick={(e) => {
                e.stopPropagation();
                window.open("https://www.tychos.space", "_blank");
              }}
              style={{
                color: "#8C92A4",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8C92A4")}
            >
              <FaExternalLinkAlt />
            </div>
            <div
              title="GitHub Repository"
              onClick={(e) => {
                e.stopPropagation();
                window.open("https://github.com/pholmq/TSN", "_blank");
              }}
              style={{
                color: "#8C92A4",
                cursor: "pointer",
                fontSize: "13px",
                display: "flex",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#8C92A4")}
            >
              <FaGithub />
            </div>
          </div>
        </div>

        <div
          onClick={() => setShowHelp(false)}
          style={{
            cursor: "pointer",
            color: "#8C92A4",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "4px",
            marginRight: "-2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8C92A4")}
          title="Close Help"
        >
          ✕
        </div>
      </div>

      <div
        className="markdown-content"
        style={{
          padding: "16px 20px",
          paddingBottom: "30px",
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          lineHeight: "1.5",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h3
                style={{
                  color: "#60a5fa",
                  marginBottom: "8px",
                  fontSize: "15px",
                  marginTop: "16px",
                }}
              >
                {children}
              </h3>
            ),
            h2: ({ children }) => (
              <h3
                style={{
                  color: "#60a5fa",
                  marginBottom: "8px",
                  fontSize: "15px",
                  marginTop: "16px",
                }}
              >
                {children}
              </h3>
            ),
            h3: ({ children }) => (
              <h3
                style={{
                  color: "#60a5fa",
                  marginBottom: "8px",
                  fontSize: "15px",
                  marginTop: "16px",
                }}
              >
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul style={{ paddingLeft: "20px", margin: "0 0 12px 0" }}>
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: "6px" }}>{children}</li>
            ),
            p: ({ children }) => (
              <p style={{ margin: "0 0 12px 0" }}>{children}</p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#60a5fa", textDecoration: "none" }}
              >
                {children}
              </a>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: "bold" }}>{children}</strong>
            ),
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>,
    document.body
  );
};

export default Help;
