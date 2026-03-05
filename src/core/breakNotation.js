import React, { useEffect, useRef, useState } from "react";
import { useAppConfig } from "../core/config";

export default function BreakNotations({
  breaks = [],
  signalCount = 0,
  mode,
  onUpdate,
  onDelete,
}) {
  const [selected, setSelected] = useState(null);
  const groupRef = useRef(null);
  const { config } = useAppConfig();
  const darkMode = config.darkMode ?? true;

  const dx = config.dx;
  const dy = config.dy;
  const offsetY = config.offsetY;

  useEffect(() => {
    if (!mode) setSelected(null);
  }, [mode]);

  useEffect(() => {
    setSelected(null);
  }, [breaks.length]);

  useEffect(() => {
    const handleDocumentPointerDown = (evt) => {
      if (!groupRef.current) return;
      if (!groupRef.current.contains(evt.target)) {
        setSelected(null);
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, []);

  const handleSelect = (idx, evt) => {
    if (!mode) return;
    evt.stopPropagation();
    setSelected(idx);
    if (groupRef.current) {
      groupRef.current.focus();
    }
  };

  const handleBackgroundClick = () => {
    setSelected(null);
  };

  const handleKeyDown = (evt) => {
    if (!mode) return;
    if (selected === null) return;

    const current = breaks[selected];
    if (!current) return;

    if (evt.key === "Escape") {
      setSelected(null);
      evt.preventDefault();
      return;
    }

    if (evt.key === "Delete" || evt.key === "Backspace") {
      const sourceIndex = current.sourceIndex ?? selected;
      if (onDelete) {
        evt.preventDefault();
        onDelete(sourceIndex);
      }
      return;
    }

    if (evt.key !== "ArrowLeft" && evt.key !== "ArrowRight") return;
    if (!onUpdate) return;

    const dir = evt.key === "ArrowLeft" ? -1 : 1;
    const step = 0.1;
    const nextTimeStamp = Math.max(
      0,
      Math.round((current.timeStamp + dir * step) * 10) / 10
    );
    const sourceIndex = current.sourceIndex ?? selected;
    const { sourceIndex: _skip, ...rest } = current;
    const updated = { ...rest, timeStamp: nextTimeStamp };
    evt.preventDefault();
    onUpdate(sourceIndex, updated);
  };

  return (
    <g
      id="break-notations"
      ref={groupRef}
      tabIndex={0}
      focusable="true"
      style={{ outline: "none" }}
      onKeyDown={handleKeyDown}
      onClick={handleBackgroundClick}
    >
      {breaks.map((item, idx) => {
        const x = item.timeStamp * dx;
        const targets = item.global
          ? Array.from({ length: Math.max(0, signalCount) }, (_, i) => i)
          : [item.signalIndex];

        return targets.map((targetSignalIdx) => {
          const yCenter = targetSignalIdx * (dy + offsetY) + dy / 2 - 10;
          const lineHalf = Math.max(6, dy / 2);
          const gap = 3;
          const isSelected = selected === idx;
          const stroke = isSelected
            ? darkMode
              ? "#22d3ee"
              : "#0284c7"
            : darkMode
            ? "#e5e7eb"
            : "#1f2937";

          return (
            <g
              key={`${idx}-${targetSignalIdx}`}
              transform={`rotate(15 ${x} ${yCenter})`}
              style={{ cursor: mode ? "pointer" : "default" }}
            >
              <rect
                x={x - 8}
                y={yCenter - lineHalf - 4}
                width={16}
                height={lineHalf * 2 + 8}
                fill="transparent"
                onClick={(evt) => handleSelect(idx, evt)}
              />
              <line
                x1={x - gap / 2}
                y1={yCenter - lineHalf}
                x2={x - gap / 2}
                y2={yCenter + lineHalf}
                stroke={stroke}
                strokeWidth={isSelected ? 2.2 : 1.6}
                onClick={(evt) => handleSelect(idx, evt)}
              />
              <line
                x1={x + gap / 2}
                y1={yCenter - lineHalf}
                x2={x + gap / 2}
                y2={yCenter + lineHalf}
                stroke={stroke}
                strokeWidth={isSelected ? 2.2 : 1.6}
                onClick={(evt) => handleSelect(idx, evt)}
              />
            </g>
          );
        });
      })}
    </g>
  );
}
