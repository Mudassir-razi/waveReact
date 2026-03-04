import React, { useState, useRef, useEffect } from 'react';
import { useAppConfig } from "../core/config";
/**
 * TimingAnnotations
 * 
 * Renders editable timing diagram annotations as SVG <g> elements.
 * Double-click on text to edit inline.
 * 
 * @param {Array} annotations - Array of {text, start, end, head, foot}
 * @param {Function} onUpdate - Callback(index, newAnnotation) when annotation changes
 */
export default function TimingAnnotations({
  mode,
  annotations = [],
  onUpdate,
  colors = {},
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef(null);
  const groupRef = useRef(null);
  const [selected, setSelected] = useState(null); // { index, part: 'left'|'right'|'bar' }

  const { config } = useAppConfig();
  const dx = config.dx;

  const {
    strokeColor = "#888",
    selectedStrokeColor = "#22d3ee",
    textColor = "#bbb",
    selectedTextColor = "#e5e7eb",
  } = colors;

  // Focus the input when editing starts
  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIdx]);

  // Clear selection when annotations list changes drastically
  useEffect(() => {
    setSelected(null);
  }, [annotations.length]);

  // Any mode switch out of editable annotation mode should clear selection/edit state.
  useEffect(() => {
    if (!mode) {
      setSelected(null);
      setEditingIdx(null);
      setEditText('');
    }
  }, [mode]);

  // Clicking anywhere outside annotation group deselects current selection.
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
      onUpdate(idx, { ...annotations[idx], text: editText.trim() });
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

    // Do not move while editing text
    if (editingIdx !== null) return;

    const { index, part } = selected;
    const ann = annotations[index];
    if (!ann) return;

    let updated = { ...ann };
    let changed = false;

    const dxStep = 1;
    const dyStep = 5;

    if (e.key === "Escape") {
      setSelected(null);
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const dir = e.key === "ArrowLeft" ? -1 : 1;

      if (part === "left") {
        const nextStart = Math.max(0, updated.start + dir * dxStep);
        if (nextStart <= updated.end) {
          updated.start = nextStart;
          changed = true;
        }
      } else if (part === "right") {
        const nextEnd = Math.max(updated.start, updated.end + dir * dxStep);
        updated.end = nextEnd;
        changed = true;
      } else if (part === "bar") {
        const width = updated.end - updated.start;
        const nextStart = Math.max(0, updated.start + dir * dxStep);
        updated.start = nextStart;
        updated.end = nextStart + width;
        changed = true;
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      // Vertical movement moves the whole annotation
      const dir = e.key === "ArrowUp" ? -1 : 1;
      updated.head = updated.head + dir * dyStep;
      updated.foot = updated.foot + dir * dyStep;
      changed = true;
    }

    if (changed) {
      e.preventDefault();
      onUpdate(index, updated);
    }
  };

  const handleBackgroundClick = () => {
    setSelected(null);
  };

  return (
    
    <g
      id="timing-annotations"
      ref={groupRef}
      tabIndex={0}
      focusable="true"
      style={{ outline: "none" }}
      onKeyDown={handleGroupKeyDown}
      onClick={handleBackgroundClick}
    >
      {annotations.map((ann, idx) => {
        const { text, start, end, head, foot } = ann;

        // Compute positions
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
            {/* Invisible hitboxes for easier selection */}
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

            {/* Vertical ticks at start and end */}
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

            {/* Horizontal span line */}
            <line
              x1={x1}
              y1={yMid}
              x2={x2}
              y2={yMid}
              stroke={isBarSelected ? selectedStrokeColor : strokeColor}
              strokeWidth={isBarSelected ? 2 : 1}
              onClick={(e) => handleSelectPart(idx, "bar", e)}
            />

            {/* Arrowheads (optional — simple chevrons) */}
            <polyline
              points={`${x1 + 4},${yMid - 3} ${x1},${yMid} ${x1 + 4},${yMid + 3}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={1}
            />
            <polyline
              points={`${x2 - 4},${yMid - 3} ${x2},${yMid} ${x2 - 4},${yMid + 3}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={1}
            />

            {/* Text label — editable on double-click */}
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
                    border: '1px solid #22d3ee',
                    borderRadius: 3,
                    background: '#0a0d14',
                    color: '#e2e8f0',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    padding: '2px 4px',
                    outline: 'none',
                  }}
                />
              </foreignObject>
            ) : (
              <text
                x={xMid}
                y={yMid - 5}
                textAnchor="middle"
                fontSize={11}
                fill={isSelected ? selectedTextColor : textColor}
                fontFamily="monospace"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onDoubleClick={() => handleDoubleClick(idx, text)}
              >
                {text}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

