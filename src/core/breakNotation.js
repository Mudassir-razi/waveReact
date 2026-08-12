import React, { useEffect, useRef, useState } from "react";
import { useAppConfig } from "../core/config";
import { getSignalBreakBounds } from "./waveGeometry";

const GAP = 5;
const BULGE = 2.8;

function buildBreakTargets(breaks, signalCount, dx, dy, offsetY) {
  return breaks.flatMap((item, idx) => {
    const x = item.timeStamp * dx;
    const targets = item.global
      ? Array.from({ length: Math.max(0, signalCount) }, (_, i) => i)
      : [item.signalIndex];

    return targets.map((targetSignalIdx) => ({
      key: `${idx}-${targetSignalIdx}`,
      idx,
      x,
      targetSignalIdx,
      bounds: getSignalBreakBounds(targetSignalIdx, dy, offsetY),
    }));
  });
}

export function BreakMaskLayer({ breaks = [], signalCount = 0, fill }) {
  const { config } = useAppConfig();
  const dx = config.dx;
  const dy = config.dy;
  const offsetY = config.offsetY;

  const breakTargets = buildBreakTargets(breaks, signalCount, dx, dy, offsetY);

  return (
    <g id="break-masks">
      {breakTargets.map(({ key, x, bounds }) => {
        const height = bounds.bottom - bounds.top;
        const maskHalfWidth = GAP / 2 + BULGE + 3;

        return (
          <rect
            key={`mask-${key}`}
            x={x - maskHalfWidth}
            y={bounds.top}
            width={maskHalfWidth * 2}
            height={height}
            fill={fill}
          />
        );
      })}
    </g>
  );
}

function BreakCurves({ x, top, bottom, gap, stroke, strokeWidth, onSelect }) {
  const height = bottom - top;
  const halfGap = gap / 2;
  const bulge = Math.min(2.8, height * 0.12);

  const sCurvePath = (lineX) => {
    const mid = top + height / 2;
    return [
      `M ${lineX} ${top}`,
      `C ${lineX + bulge} ${top + height * 0.22}, ${lineX + bulge} ${mid - height * 0.08}, ${lineX} ${mid}`,
      `C ${lineX - bulge} ${mid + height * 0.08}, ${lineX - bulge} ${bottom - height * 0.22}, ${lineX} ${bottom}`,
    ].join(" ");
  };

  const leftX = x - halfGap - 1.5;
  const rightX = x + halfGap + 1.5;

  return (
    <g onClick={onSelect}>
      <rect
        x={x - 10}
        y={top - 4}
        width={20}
        height={height + 8}
        fill="transparent"
      />
      <path
        d={sCurvePath(leftX)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={sCurvePath(rightX)}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default function BreakNotations({
  breaks = [],
  signalCount = 0,
  darkMode = true,
  mode,
  onUpdate,
  onDelete,
}) {
  const [selected, setSelected] = useState(null);
  const groupRef = useRef(null);
  const { config } = useAppConfig();

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
    const step = evt.shiftKey ? 0.1 : 1;
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

  const breakTargets = buildBreakTargets(breaks, signalCount, dx, dy, offsetY);

  return (
    <g
      id="break-glyphs"
      ref={groupRef}
      tabIndex={0}
      focusable="true"
      style={{ outline: "none" }}
      onKeyDown={handleKeyDown}
      onClick={handleBackgroundClick}
    >
      {breakTargets.map(({ key, idx, x, bounds }) => {
        const isSelected = selected === idx;
        const stroke = isSelected
          ? darkMode
            ? "#22d3ee"
            : "#0284c7"
          : darkMode
          ? "#e5e7eb"
          : "#1f2937";
        const strokeWidth = isSelected ? 2.2 : 1.8;

        return (
          <g
            key={`glyph-${key}`}
            style={{ cursor: mode ? "pointer" : "default" }}
          >
            <BreakCurves
              x={x}
              top={bounds.top}
              bottom={bounds.bottom}
              gap={GAP}
              stroke={stroke}
              strokeWidth={strokeWidth}
              onSelect={(evt) => handleSelect(idx, evt)}
            />
          </g>
        );
      })}
    </g>
  );
}
