import React, { useState } from "react";

export default function ToggleButton({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  size = "md",
  labels,
  ariaLabel = "Toggle",
}) {
  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const checked = isControlled ? controlledChecked : internalChecked;

  function toggle() {
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  }

  // Size map in pixels
  const SIZES = {
    sm: { trackW: 40, trackH: 20, knob: 16 },
    md: { trackW: 56, trackH: 28, knob: 24 },
    lg: { trackW: 80, trackH: 40, knob: 36 },
  };

  const s = SIZES[size] || SIZES.md;

  const trackStyle = {
    width: `${s.trackW}px`,
    height: `${s.trackH}px`,
    backgroundColor: checked ? "#2b384dff" : "#d6d6beff",
    borderRadius: 0,//`${s.trackH / 2}px`,
    position: "relative",
    transition: "background-color 0.2s ease-in-out",
    flexShrink: 0,
  };

  const knobStyle = {
    width: `${s.knob}px`,
    height: `${s.knob}px`,
    backgroundColor: checked ? "#1e2735ff" : "#fffecfff",
    borderRadius: "5%",
    position: "absolute",
    top: "50%",
    left: checked ? `${s.trackW - s.knob - 2}px` : "2px",
    transform: "translateY(-50%)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    transition: "left 0.2s ease-in-out",
  };

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: labels ? "8px" : "0px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    padding: 0,
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={toggle}
      style={buttonStyle}
    >
      {labels && (
        <span style={{ userSelect: "none", fontSize: "14px" }}>
          {checked ? labels[1] ?? "On" : labels[0] ?? "Off"}
        </span>
      )}
      <span style={trackStyle}>
        <span style={knobStyle} />
      </span>
    </button>
  );
}
