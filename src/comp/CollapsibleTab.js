import React, { useState } from 'react';

const CollapsibleRightTab = ({ viewMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelWidth = 450;
  const panelHeight = 300; // fixed height for scrolling

  return (
    <div
      style={{
        position: 'fixed',
        top: '400px',
        right: 0,
        display: 'flex',
        flexDirection: 'row-reverse',
        zIndex: 1000,
      }}
    >
      {/* Toggle Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#2f3338',
          color: 'white',
          padding: '10px 5px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          writingMode: 'vertical-rl',
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        {isOpen ? 'Close' : 'User guide'}
      </div>

      {/* Collapsible Panel */}
      <div
        style={{
          width: `${panelWidth}px`,
          height: `${panelHeight}px`,
          transform: isOpen ? 'translateX(0)' : `translateX(${panelWidth}px)`,
          transition: 'transform 0.3s ease',
          backgroundColor: viewMode ? '#f1f1f1' : '#2f3338',
          border: '0px',
          borderRight: 'none',
          overflowY: 'auto', // enable vertical scrolling
          padding: '10px',
          boxSizing: 'border-box',
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0,
          transitionProperty: 'transform, opacity',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          <li>
            Valid signal properties are — <span className='highlight'>name, wave, data, width, scale, color</span>
          </li>
          <li>
            Valid wave bits are — <span className='highlight'>1 0 . h H l L p P n N = |</span> and color codes
          </li>
          <li>Color codes are — r g b a m o v y.</li>
          <li>
            Group waves using ["groupName", wave1, wave2]. Nested groups are also supported.
          </li>
          <li>
            Use (pattern, count) to repeat. Example: <code>=(10, 3)</code> → <code>=101010</code> (works in wave property)
          </li>
          <li>
            Use ud/ux/ub/dd/dx/db(baseValue, count) or (baseValue, count, interval) for counting up/down in decimal, hex, or binary.
            Example: <code>ux(5,5)</code> → <code>5 6 7 8 9</code> (works in data property)
          </li>
          <li>
            The green box over the "Add New" button turns RED if you enter incorrect code.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CollapsibleRightTab;
