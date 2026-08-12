import React, { useState, useRef, useEffect } from "react";
import { useAppConfig } from "./config";

function AnnotationLabel({ text, x, y, fill, fontSize, subFontSize, onDoubleClick }) {
  const underscore = text.indexOf("_");

  if (underscore === -1) {
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={fontSize}
        fill={fill}
        fontFamily="monospace"
        style={{ cursor: "pointer", userSelect: "none" }}
        onDoubleClick={onDoubleClick}
      >
        {text}
      </text>
    );
  }

  const base = text.slice(0, underscore);
  const subscript = text.slice(underscore + 1);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={fontSize}
      fill={fill}
      fontFamily="monospace"
      style={{ cursor: "pointer", userSelect: "none" }}
      onDoubleClick={onDoubleClick}
    >
      <tspan>{base}</tspan>
      <tspan fontSize={subFontSize} baselineShift="sub">
        {subscript}
      </tspan>
    </text>
  );
}

export function getCurveControls(x1, y1, x2, y2, bend) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const strength = bend ?? Math.min(36, Math.max(10, len * 0.22));
  const nx = -dy / len;
  const ny = dx / len;

  return {
    cx1: x1 + dx * 0.33 + nx * strength,
    cy1: y1 + dy * 0.33 + ny * strength,
    cx2: x1 + dx * 0.67 - nx * strength,
    cy2: y1 + dy * 0.67 - ny * strength,
  };
}

export function buildSCubicPath(x1, y1, x2, y2, bend) {
  const { cx1, cy1, cx2, cy2 } = getCurveControls(x1, y1, x2, y2, bend);
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export function buildCubicPath(x0, y0, cx1, cy1, cx2, cy2, x3, y3) {
  return `M ${x0} ${y0} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x3} ${y3}`;
}

/** Default cubic handles from the user-placed middle anchor (cx, cy). */
export function deriveCubicControls(x1, y1, x2, y2, cx, cy) {
  const pull = 0.92;
  let cx1 = x1 + pull * (cx - x1);
  let cy1 = y1 + pull * (cy - y1);
  let cx2 = x2 + pull * (cx - x2);
  let cy2 = y2 + pull * (cy - y2);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const bulge = (cx - mx) * nx + (cy - my) * ny;
  const sBoost = bulge * 0.35;

  cx1 += nx * sBoost;
  cy1 += ny * sBoost;
  cx2 -= nx * sBoost;
  cy2 -= ny * sBoost;

  return { cx1, cy1, cx2, cy2 };
}

export function createCurveHandles(x1, y1, x2, y2, cx, cy) {
  const { cx1, cy1, cx2, cy2 } = deriveCubicControls(x1, y1, x2, y2, cx, cy);
  return { h1x: cx1, h1y: cy1, h2x: cx2, h2y: cy2 };
}

export function hasCurveControl(cx, cy) {
  return typeof cx === "number" && typeof cy === "number";
}

export function hasStoredHandles(h1x, h1y, h2x, h2y) {
  return (
    typeof h1x === "number" &&
    typeof h1y === "number" &&
    typeof h2x === "number" &&
    typeof h2y === "number"
  );
}

export function resolveCurveHandles(ann) {
  const { x1, y1, x2, y2, cx, cy, h1x, h1y, h2x, h2y, bend } = ann;
  if (hasStoredHandles(h1x, h1y, h2x, h2y)) {
    return { cx1: h1x, cy1: h1y, cx2: h2x, cy2: h2y };
  }
  if (hasCurveControl(cx, cy)) {
    return deriveCubicControls(x1, y1, x2, y2, cx, cy);
  }
  return getCurveControls(x1, y1, x2, y2, bend);
}

export function buildCurvePath(x1, y1, x2, y2, cx, cy, bend, h1x, h1y, h2x, h2y) {
  const handles = resolveCurveHandles({
    x1,
    y1,
    x2,
    y2,
    cx,
    cy,
    bend,
    h1x,
    h1y,
    h2x,
    h2y,
  });
  return buildCubicPath(x1, y1, handles.cx1, handles.cy1, handles.cx2, handles.cy2, x2, y2);
}

export function buildCurvePathFromAnn(ann) {
  return buildCurvePath(
    ann.x1,
    ann.y1,
    ann.x2,
    ann.y2,
    ann.cx,
    ann.cy,
    ann.bend,
    ann.h1x,
    ann.h1y,
    ann.h2x,
    ann.h2y
  );
}

export function cubicPointAtGeneric(t, x0, y0, x1, y1, x2, y2, x3, y3) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t2 * t * x3,
    y: mt2 * mt * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t2 * t * y3,
  };
}

export function curvePointAtFromAnn(t, ann) {
  const { x1, y1, x2, y2 } = ann;
  const { cx1, cy1, cx2, cy2 } = resolveCurveHandles(ann);
  return cubicPointAtGeneric(t, x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

export function curvePointAt(t, x1, y1, x2, y2, cx, cy, bend, h1x, h1y, h2x, h2y) {
  return curvePointAtFromAnn(t, {
    x1,
    y1,
    x2,
    y2,
    cx,
    cy,
    bend,
    h1x,
    h1y,
    h2x,
    h2y,
  });
}

export function cubicPointAt(t, x1, y1, x2, y2, bend) {
  const { cx1, cy1, cx2, cy2 } = getCurveControls(x1, y1, x2, y2, bend);
  return cubicPointAtGeneric(t, x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}

export function materializeCurveHandles(ann) {
  const next = { ...ann };
  if (!hasStoredHandles(next.h1x, next.h1y, next.h2x, next.h2y)) {
    const { cx1, cy1, cx2, cy2 } = resolveCurveHandles(next);
    next.h1x = cx1;
    next.h1y = cy1;
    next.h2x = cx2;
    next.h2y = cy2;
  }
  return next;
}

export function clientToSvgPoint(svg, clientX, clientY) {
  if (!svg || typeof svg.createSVGPoint !== "function") {
    return { x: clientX, y: clientY };
  }
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const mapped = pt.matrixTransform(ctm.inverse());
  return { x: mapped.x, y: mapped.y };
}

export function applyCurveDrag(base, part, dx, dy) {
  const u = { ...base };
  if (part === "p1") {
    u.x1 = base.x1 + dx;
    u.y1 = base.y1 + dy;
  } else if (part === "p2") {
    u.x2 = base.x2 + dx;
    u.y2 = base.y2 + dy;
  } else if (part === "h1") {
    u.h1x = base.h1x + dx;
    u.h1y = base.h1y + dy;
  } else if (part === "h2") {
    u.h2x = base.h2x + dx;
    u.h2y = base.h2y + dy;
  } else if (part === "anchor") {
    u.cx = base.cx + dx;
    u.cy = base.cy + dy;
    if (hasStoredHandles(base.h1x, base.h1y, base.h2x, base.h2y)) {
      u.h1x = base.h1x + dx;
      u.h1y = base.h1y + dy;
      u.h2x = base.h2x + dx;
      u.h2y = base.h2y + dy;
    }
  } else if (part === "curve") {
    u.x1 = base.x1 + dx;
    u.y1 = base.y1 + dy;
    u.x2 = base.x2 + dx;
    u.y2 = base.y2 + dy;
    if (hasCurveControl(base.cx, base.cy)) {
      u.cx = base.cx + dx;
      u.cy = base.cy + dy;
    }
    if (hasStoredHandles(base.h1x, base.h1y, base.h2x, base.h2y)) {
      u.h1x = base.h1x + dx;
      u.h1y = base.h1y + dy;
      u.h2x = base.h2x + dx;
      u.h2y = base.h2y + dy;
    }
  }
  return u;
}

function moveCurvePart(updated, part, key, step) {
  const delta = (axis) => {
    if (key === `Arrow${axis === "x" ? "Left" : "Up"}`) return -step;
    if (key === `Arrow${axis === "x" ? "Right" : "Down"}`) return step;
    return 0;
  };
  const dx = delta("x");
  const dy = delta("y");
  if (!dx && !dy) return false;

  if (part === "p1") {
    updated.x1 += dx;
    updated.y1 += dy;
  } else if (part === "p2") {
    updated.x2 += dx;
    updated.y2 += dy;
  } else if (part === "anchor") {
    updated.cx += dx;
    updated.cy += dy;
    if (hasStoredHandles(updated.h1x, updated.h1y, updated.h2x, updated.h2y)) {
      updated.h1x += dx;
      updated.h1y += dy;
      updated.h2x += dx;
      updated.h2y += dy;
    }
  } else if (part === "h1") {
    updated.h1x += dx;
    updated.h1y += dy;
  } else if (part === "h2") {
    updated.h2x += dx;
    updated.h2y += dy;
  } else if (part === "curve") {
    updated.x1 += dx;
    updated.y1 += dy;
    updated.x2 += dx;
    updated.y2 += dy;
    if (hasCurveControl(updated.cx, updated.cy)) {
      updated.cx += dx;
      updated.cy += dy;
    }
    if (hasStoredHandles(updated.h1x, updated.h1y, updated.h2x, updated.h2y)) {
      updated.h1x += dx;
      updated.h1y += dy;
      updated.h2x += dx;
      updated.h2y += dy;
    }
  } else {
    return false;
  }
  return true;
}

export default function CurvedAnnotations({
  annotations = [],
  mode,
  onUpdate,
  onDelete,
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef(null);
  const groupRef = useRef(null);
  const [selected, setSelected] = useState(null); // anchor | h1 | h2 | p1 | p2 | curve
  const [drag, setDrag] = useState(null);

  const { config } = useAppConfig();
  const darkMode = config.darkMode ?? true;

  const strokeColor = darkMode ? "#6b9fd4" : "#2563eb";
  const selectedStrokeColor = darkMode ? "#38bdf8" : "#0284c7";
  const textColor = darkMode ? "#8ec5f0" : "#1e40af";
  const selectedTextColor = darkMode ? "#bae6fd" : "#1d4ed8";
  const inputBg = darkMode ? "#0f172a" : "#f8fafc";
  const inputText = darkMode ? "#e0f2fe" : "#1e3a8a";
  const inputBorder = darkMode ? "#38bdf8" : "#2563eb";
  const labelFontSize = 13;
  const subFontSize = 10;
  const hitPad = 8;

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIdx]);

  useEffect(() => {
    setSelected(null);
  }, [annotations.length]);

  useEffect(() => {
    if (!mode) {
      setSelected(null);
      setEditingIdx(null);
      setEditText("");
    }
  }, [mode]);

  useEffect(() => {
    const handleDocumentPointerDown = (evt) => {
      if (!groupRef.current) return;
      if (!groupRef.current.contains(evt.target)) {
        setSelected(null);
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () => document.removeEventListener("pointerdown", handleDocumentPointerDown);
  }, []);

  const handleCommit = (idx) => {
    if (editText.trim() && onUpdate) {
      const sourceIndex = annotations[idx]?.sourceIndex ?? idx;
      const { sourceIndex: _skip, ...rest } = annotations[idx] || {};
      onUpdate(sourceIndex, { ...rest, text: editText.trim() });
    }
    setEditingIdx(null);
    setEditText("");
  };

  const handleSelectPart = (idx, part, evt) => {
    if (!mode) return;
    evt.stopPropagation();
    setSelected({ index: idx, part });
    groupRef.current?.focus();
  };

  const handlePointerDown = (idx, part, evt) => {
    if (!mode) return;
    evt.stopPropagation();
    if (evt.button != null && evt.button !== 0) return;

    const svg = evt.currentTarget?.ownerSVGElement || evt.target?.ownerSVGElement;
    const ann = annotations[idx];
    if (!ann) return;

    const { sourceIndex: _skip, ...raw } = ann;
    const base =
      part === "anchor" || part === "h1" || part === "h2"
        ? materializeCurveHandles(raw)
        : { ...raw };
    const startPt = clientToSvgPoint(svg, evt.clientX, evt.clientY);

    setSelected({ index: idx, part });
    setDrag({
      index: idx,
      sourceIndex: ann.sourceIndex ?? idx,
      part,
      base,
      svg,
      startX: startPt.x,
      startY: startPt.y,
    });
    groupRef.current?.focus();
  };

  useEffect(() => {
    if (!drag || !onUpdate) return;

    const handleMove = (evt) => {
      const p = clientToSvgPoint(drag.svg, evt.clientX, evt.clientY);
      const dx = p.x - drag.startX;
      const dy = p.y - drag.startY;
      onUpdate(drag.sourceIndex, applyCurveDrag(drag.base, drag.part, dx, dy));
    };
    const handleUp = () => setDrag(null);

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
    };
  }, [drag, onUpdate]);

  const handleGroupKeyDown = (e) => {
    if (!mode || !selected || !onUpdate) return;
    if (editingIdx !== null) return;

    const { index, part } = selected;
    const ann = annotations[index];
    if (!ann) return;

    const { sourceIndex: _skip, ...base } = ann;
    let updated =
      part === "anchor" || part === "h1" || part === "h2"
        ? materializeCurveHandles(base)
        : { ...base };
    const step = e.shiftKey ? 1 : 5;

    if (e.key === "Escape") {
      setSelected(null);
      e.preventDefault();
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      if (onDelete) {
        e.preventDefault();
        onDelete(ann.sourceIndex ?? index);
      }
      return;
    }

    if (moveCurvePart(updated, part, e.key, step)) {
      e.preventDefault();
      onUpdate(ann.sourceIndex ?? index, updated);
    }
  };

  return (
    <g
      id="curved-annotations"
      ref={groupRef}
      tabIndex={mode ? 0 : undefined}
      focusable={mode ? "true" : undefined}
      style={{ outline: "none" }}
      onKeyDown={handleGroupKeyDown}
      onClick={() => mode && setSelected(null)}
    >
      {annotations.map((ann, idx) => {
        const { text, x1, y1, x2, y2, cx, cy } = ann;
        const path = buildCurvePathFromAnn(ann);
        const labelPos = curvePointAtFromAnn(0.5, ann);
        const handles = resolveCurveHandles(ann);
        const showAnchor = mode && hasCurveControl(cx, cy);
        const isEditing = editingIdx === idx;
        const isSelected = selected?.index === idx;
        const isCurveSelected = isSelected && selected.part === "curve";
        const isP1Selected = isSelected && selected.part === "p1";
        const isP2Selected = isSelected && selected.part === "p2";
        const isAnchorSelected = isSelected && selected.part === "anchor";
        const isH1Selected = isSelected && selected.part === "h1";
        const isH2Selected = isSelected && selected.part === "h2";
        const stroke = isCurveSelected ? selectedStrokeColor : strokeColor;

        return (
          <g key={idx} className="curved-annotation">
            {mode && (
              <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                style={{ cursor: "move", touchAction: "none" }}
                onPointerDown={(e) => handlePointerDown(idx, "curve", e)}
                onClick={(e) => handleSelectPart(idx, "curve", e)}
              />
            )}
            <path
              d={path}
              fill="none"
              stroke={stroke}
              strokeWidth={isCurveSelected ? 2.2 : 1.6}
              strokeLinecap="round"
              pointerEvents="none"
            />
            {mode && (
              <>
                <circle
                  cx={x1}
                  cy={y1}
                  r={hitPad}
                  fill="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handlePointerDown(idx, "p1", e)}
                  onClick={(e) => handleSelectPart(idx, "p1", e)}
                />
                <circle
                  cx={x2}
                  cy={y2}
                  r={hitPad}
                  fill="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handlePointerDown(idx, "p2", e)}
                  onClick={(e) => handleSelectPart(idx, "p2", e)}
                />
                <circle
                  cx={x1}
                  cy={y1}
                  r={isP1Selected ? 4 : 3}
                  fill={isP1Selected ? selectedStrokeColor : strokeColor}
                  pointerEvents="none"
                />
                <circle
                  cx={x2}
                  cy={y2}
                  r={isP2Selected ? 4 : 3}
                  fill={isP2Selected ? selectedStrokeColor : strokeColor}
                  pointerEvents="none"
                />
              </>
            )}
            {showAnchor && (
              <>
                <line
                  x1={cx}
                  y1={cy}
                  x2={handles.cx1}
                  y2={handles.cy1}
                  stroke={strokeColor}
                  strokeWidth={0.8}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  pointerEvents="none"
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2={handles.cx2}
                  y2={handles.cy2}
                  stroke={strokeColor}
                  strokeWidth={0.8}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  pointerEvents="none"
                />
                <circle
                  cx={handles.cx1}
                  cy={handles.cy1}
                  r={hitPad}
                  fill="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handlePointerDown(idx, "h1", e)}
                  onClick={(e) => handleSelectPart(idx, "h1", e)}
                />
                <circle
                  cx={handles.cx2}
                  cy={handles.cy2}
                  r={hitPad}
                  fill="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handlePointerDown(idx, "h2", e)}
                  onClick={(e) => handleSelectPart(idx, "h2", e)}
                />
                <circle
                  cx={handles.cx1}
                  cy={handles.cy1}
                  r={isH1Selected ? 3.5 : 2.5}
                  fill={isH1Selected ? selectedStrokeColor : strokeColor}
                  fillOpacity={isH1Selected ? 1 : 0.7}
                  pointerEvents="none"
                />
                <circle
                  cx={handles.cx2}
                  cy={handles.cy2}
                  r={isH2Selected ? 3.5 : 2.5}
                  fill={isH2Selected ? selectedStrokeColor : strokeColor}
                  fillOpacity={isH2Selected ? 1 : 0.7}
                  pointerEvents="none"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={hitPad}
                  fill="transparent"
                  style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => handlePointerDown(idx, "anchor", e)}
                  onClick={(e) => handleSelectPart(idx, "anchor", e)}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isAnchorSelected ? 5 : 4}
                  fill={isAnchorSelected ? selectedStrokeColor : strokeColor}
                  stroke={darkMode ? "#0f172a" : "#ffffff"}
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              </>
            )}
            {isEditing ? (
              <foreignObject
                x={labelPos.x - 60}
                y={labelPos.y - 18}
                width={120}
                height={30}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => handleCommit(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCommit(idx);
                    if (e.key === "Escape") {
                      setEditingIdx(null);
                      setEditText("");
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 3,
                    background: inputBg,
                    color: inputText,
                    fontSize: labelFontSize,
                    fontFamily: "monospace",
                    textAlign: "center",
                    padding: "2px 4px",
                    outline: "none",
                  }}
                />
              </foreignObject>
            ) : (
              <AnnotationLabel
                text={text}
                x={labelPos.x}
                y={labelPos.y - 6}
                fill={isSelected && mode ? selectedTextColor : textColor}
                fontSize={labelFontSize}
                subFontSize={subFontSize}
                onDoubleClick={() => {
                  if (!mode) return;
                  setEditingIdx(idx);
                  setEditText(text);
                }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
