import React, { useState, useRef, useEffect } from 'react';
import { useAppConfig } from "../core/config";

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
        style={{ cursor: 'pointer', userSelect: 'none' }}
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
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onDoubleClick={onDoubleClick}
    >
      <tspan>{base}</tspan>
      <tspan fontSize={subFontSize} baselineShift="sub">{subscript}</tspan>
    </text>
  );
}

export default function TimingAnnotations({
  mode,
  annotations = [],
  onUpdate,
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef(null);
  const groupRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const { config } = useAppConfig();
  const dx = config.dx;
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
      setEditText('');
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
    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, []);

  const handleDoubleClick = (idx, currentText) => {
    if (!mode) return;
    setEditingIdx(idx);
    setEditText(currentText);
  };

  const handleCommit = (idx) => {
    if (editText.trim() && onUpdate) {
      const sourceIndex = annotations[idx]?.sourceIndex ?? idx;
      const { sourceIndex: _skip, ...rest } = annotations[idx] || {};
      onUpdate(sourceIndex, { ...rest, text: editText.trim() });
    }
    setEditingIdx(null);
    setEditText('');
  };

  const handleKeyDown = (e, idx) => {
    if (!mode) return;
    if (e.key === 'Enter') {
      handleCommit(idx);
    } else if (e.key === 'Escape') {
      setEditingIdx(null);
      setEditText('');
    }
  };

  const handleSelectPart = (idx, part, evt) => {
    if (!mode) return;
    evt.stopPropagation();
    setSelected({ index: idx, part });
    if (groupRef.current) {
      groupRef.current.focus();
    }
  };

  const handleGroupKeyDown = (e) => {
    if (!mode) return;
    if (!selected || !onUpdate) return;
    if (editingIdx !== null) return;

    const { index, part } = selected;
    const ann = annotations[index];
    if (!ann) return;

    const { sourceIndex: _skip, ...baseAnnotation } = ann;
    let updated = { ...baseAnnotation };
    let changed = false;

    const dxStep = e.shiftKey ? 0.1 : 1;
    const dyStep = 5;

    const stepTime = (value, dir) =>
      Math.max(0, Math.round((value + dir * dxStep) * 10) / 10);

    if (e.key === "Escape") {
      setSelected(null);
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const dir = e.key === "ArrowLeft" ? -1 : 1;

      if (part === "left") {
        const nextStart = stepTime(updated.start, dir);
        if (nextStart <= updated.end) {
          updated.start = nextStart;
          changed = true;
        }
      } else if (part === "right") {
        const nextEnd = Math.max(updated.start, stepTime(updated.end, dir));
        updated.end = nextEnd;
        changed = true;
      } else if (part === "bar") {
        const width = updated.end - updated.start;
        const nextStart = stepTime(updated.start, dir);
        updated.start = nextStart;
        updated.end = nextStart + width;
        changed = true;
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const dir = e.key === "ArrowUp" ? -1 : 1;
      updated.head = updated.head + dir * dyStep;
      updated.foot = updated.foot + dir * dyStep;
      changed = true;
    }

    if (changed) {
      e.preventDefault();
      const sourceIndex = annotations[index]?.sourceIndex ?? index;
      onUpdate(sourceIndex, updated);
    }
  };

  return (
    <g
      id="timing-annotations"
      ref={groupRef}
      tabIndex={0}
      focusable="true"
      style={{ outline: "none" }}
      onKeyDown={handleGroupKeyDown}
      onClick={() => setSelected(null)}
    >
      {annotations.map((ann, idx) => {
        const { text, start, end, head, foot } = ann;

        const x1 = start * dx;
        const x2 = end * dx;
        const xMid = (x1 + x2) / 2;
        const yHead = head;
        const yFoot = foot;
        const yMid = yHead;
        const yTop = Math.min(yHead, yFoot);
        const height = Math.max(1, Math.abs(yFoot - yHead));
        const hitPad = 6;

        const isEditing = editingIdx === idx;
        const isSelected = selected && selected.index === idx;
        const isLeftSelected = isSelected && selected.part === "left";
        const isRightSelected = isSelected && selected.part === "right";
        const isBarSelected = isSelected && selected.part === "bar";

        return (
          <g key={idx} className="annotation">
            <rect
              x={x1 - hitPad}
              y={yTop - hitPad}
              width={hitPad * 2}
              height={height + hitPad * 2}
              fill="transparent"
              onClick={(e) => handleSelectPart(idx, "left", e)}
            />
            <rect
              x={x2 - hitPad}
              y={yTop - hitPad}
              width={hitPad * 2}
              height={height + hitPad * 2}
              fill="transparent"
              onClick={(e) => handleSelectPart(idx, "right", e)}
            />
            <rect
              x={Math.min(x1, x2)}
              y={yMid - hitPad}
              width={Math.max(1, Math.abs(x2 - x1))}
              height={hitPad * 2}
              fill="transparent"
              onClick={(e) => handleSelectPart(idx, "bar", e)}
            />

            <line
              x1={x1}
              y1={yHead}
              x2={x1}
              y2={yFoot}
              stroke={isLeftSelected ? selectedStrokeColor : strokeColor}
              strokeWidth={isLeftSelected ? 2 : 1}
              onClick={(e) => handleSelectPart(idx, "left", e)}
            />
            <line
              x1={x2}
              y1={yHead}
              x2={x2}
              y2={yFoot}
              stroke={isRightSelected ? selectedStrokeColor : strokeColor}
              strokeWidth={isRightSelected ? 2 : 1}
              onClick={(e) => handleSelectPart(idx, "right", e)}
            />
            <line
              x1={x1}
              y1={yMid}
              x2={x2}
              y2={yMid}
              stroke={isBarSelected ? selectedStrokeColor : strokeColor}
              strokeWidth={isBarSelected ? 2 : 1}
              onClick={(e) => handleSelectPart(idx, "bar", e)}
            />

            <polyline
              points={`${x1 + 4},${yMid - 3} ${x1},${yMid} ${x1 + 4},${yMid + 3}`}
              fill="none"
              stroke={isLeftSelected ? selectedStrokeColor : strokeColor}
              strokeWidth={1}
            />
            <polyline
              points={`${x2 - 4},${yMid - 3} ${x2},${yMid} ${x2 - 4},${yMid + 3}`}
              fill="none"
              stroke={isRightSelected ? selectedStrokeColor : strokeColor}
              strokeWidth={1}
            />

            {isEditing ? (
              <foreignObject x={xMid - 60} y={yMid - 15} width={120} height={30}>
                <input
                  ref={inputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => handleCommit(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 3,
                    background: inputBg,
                    color: inputText,
                    fontSize: labelFontSize,
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    padding: '2px 4px',
                    outline: 'none',
                  }}
                />
              </foreignObject>
            ) : (
              <AnnotationLabel
                text={text}
                x={xMid}
                y={yMid - 5}
                fill={isSelected ? selectedTextColor : textColor}
                fontSize={labelFontSize}
                subFontSize={subFontSize}
                onDoubleClick={() => handleDoubleClick(idx, text)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
