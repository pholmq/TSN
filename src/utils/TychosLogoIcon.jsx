import React from "react";

const TychosLogoIcon = ({
  size = 20,
  bgColor = "#181c20",
  color = "#ffffff",
  className = "",
}) => (
  <svg
    className={className}
    width={size}
    height={size * (453 / 376)}
    viewBox="0 0 376 453"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <g stroke={color} strokeWidth="10" fill="none">
      <circle cx="188" cy="195" r="175" />
      <circle cx="188" cy="195" r="80" />
      <circle cx="188" cy="195" r="45" />
      <circle cx="188" cy="317" r="122" />
      <circle cx="188" cy="366" r="49" />
    </g>

    <g fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round">
      <polygon points="184,180 192,180 188,165" />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(45 188 195)"
      />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(90 188 195)"
      />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(135 188 195)"
      />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(180 188 195)"
      />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(225 188 195)"
      />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(270 188 195)"
      />
      <polygon
        points="184,180 192,180 188,165"
        transform="rotate(315 188 195)"
      />
    </g>

    <circle
      cx="188"
      cy="195"
      r="15"
      fill={bgColor}
      stroke={color}
      strokeWidth="10"
    />
    <circle cx="188" cy="317" r="14" fill={color} />
    <circle
      cx="188"
      cy="20"
      r="9"
      fill={bgColor}
      stroke={color}
      strokeWidth="10"
    />
  </svg>
);

export default TychosLogoIcon;
