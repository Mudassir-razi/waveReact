import React, { useState, useRef, useEffect } from 'react';

/**
 * TimingAnnotations
 * 
 * Renders editable timing diagram annotations as SVG <g> elements.
 * Double-click on text to edit inline.
 * 
 * @param {Array} annotations - Array of {text, start, end, head, foot}
 * @param {Function} onUpdate - Callback(index, newAnnotation) when text changes
 * @param {Object} config - { dx: pixelsPerTimeUnit }
 */
export default function TimingAnnotations({ mode, annotations = [], onUpdate, config = { dx: 30 } }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef(null);

  // Focus the input when editing starts
  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIdx]);

  const handleDoubleClick = (idx, currentText) => {
    if(!mode)return;
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
    if(!mode)return;
    if (e.key === 'Enter') {
      handleCommit(idx);
    } else if (e.key === 'Escape') {
      setEditingIdx(null);
      setEditText('');
    }
  };

  return (
    <g id="timing-annotations">
      {annotations.map((ann, idx) => {
        const { text, start, end, head, foot } = ann;
        const { dx } = config;

        // Compute positions
        const x1 = start * dx;
        const x2 = end * dx;
        const xMid = (x1 + x2) / 2;
        const yHead = head;
        const yFoot = foot;
        const yMid = (yHead + yFoot) / 2;

        const isEditing = editingIdx === idx;

        return (
          <g key={idx} className="annotation">
            {/* Vertical ticks at start and end */}
            <line x1={x1} y1={yHead} x2={x1} y2={yFoot} stroke="#888" strokeWidth={1} />
            <line x1={x2} y1={yHead} x2={x2} y2={yFoot} stroke="#888" strokeWidth={1} />

            {/* Horizontal span line */}
            <line x1={x1} y1={yMid} x2={x2} y2={yMid} stroke="#888" strokeWidth={1} />

            {/* Arrowheads (optional — simple chevrons) */}
            <polyline
              points={`${x1 + 4},${yMid - 3} ${x1},${yMid} ${x1 + 4},${yMid + 3}`}
              fill="none"
              stroke="#888"
              strokeWidth={1}
            />
            <polyline
              points={`${x2 - 4},${yMid - 3} ${x2},${yMid} ${x2 - 4},${yMid + 3}`}
              fill="none"
              stroke="#888"
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
                fill="#bbb"
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

