import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../../store";
import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import helpContent from "./HelpContent.md";

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

  return (
    <div
      ref={helpRef}
      style={{
        position: "fixed",
        top: "50%",
        left: `${30 + position.x}px`,
        transform: `translateY(calc(-50% + ${position.y}px))`,
        backgroundColor: "#111827",
        color: "white",
        padding: "0",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        maxWidth: "600px",
        maxHeight: "80vh",
        overflow: "hidden",
        border: "1px solid #374151",
        userSelect: isDragging ? "none" : "auto",
        opacity: 0.8,
      }}
    >
      <div
        className="help-header"
        onMouseDown={handleMouseDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 30px",
          cursor: isDragging ? "grabbing" : "grab",
          borderBottom: "1px solid #374151",
          backgroundColor: "#111827",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            The TYCHOSIUM
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="menu-button menu-header-button"
              title="Learn about the TYCHOS model at www.tychos.space"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering drag
                window.open("https://www.tychos.space", "_blank");
              }}
              style={{ fontSize: "18px" }}
            >
              <FaExternalLinkAlt />
            </button>
            <button
              className="menu-button menu-header-button"
              title="GitHub Repository"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering drag
                window.open("https://github.com/pholmq/TSN", "_blank");
              }}
              style={{ fontSize: "18px" }}
            >
              <FaGithub />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(false)}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "white",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          ✕
        </button>
      </div>

      <div
        className="markdown-content"
        style={{
          padding: "30px",
          paddingBottom: "50px",
          height: "calc(80vh - 80px)",
          overflowY: "auto",
          overflowX: "hidden",
          lineHeight: "1.6",
          fontSize: "12px",
          boxSizing: "border-box",
        }}
      >
        <ReactMarkdown
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => (
              <h3
                style={{
                  color: "#60a5fa",
                  marginBottom: "12px",
                  fontSize: "18px",
                  marginTop: "24px",
                }}
              >
                {children}
              </h3>
            ),
            h2: ({ children }) => (
              <h3
                style={{
                  color: "#60a5fa",
                  marginBottom: "12px",
                  fontSize: "18px",
                  marginTop: "24px",
                }}
              >
                {children}
              </h3>
            ),
            h3: ({ children }) => (
              <h3
                style={{
                  color: "#60a5fa",
                  marginBottom: "12px",
                  fontSize: "18px",
                  marginTop: "24px",
                }}
              >
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul style={{ paddingLeft: "20px", margin: "0 0 16px 0" }}>
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: "8px" }}>{children}</li>
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
    </div>
  );
};

export default Help;
