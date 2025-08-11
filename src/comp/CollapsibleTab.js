import React, { useState } from 'react';

const CollapsibleRightTab = (viewMode) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelWidth = 450;

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
          fontFamily:'monospace',
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
          transform: isOpen ? 'translateX(0)' : `translateX(${panelWidth}px)`,
          transition: 'transform 0.3s ease',
          backgroundColor: (viewMode ? '#f1f1f1' : '#2f3338'),
          border: '0px',
          borderRight: 'none',
          overflow: 'hidden',
          padding: '10px',
          boxSizing: 'border-box',
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0,
          transitionProperty: 'transform, opacity',
          fontSize: '12px',
          fontFamily:'monospace',
        }}
      >
        <p>1. Valid ignal properties are- <span className='highlight'>name, wave, data, width, scale, color</span> </p>
        <p>2. Valid wave bits are- <span className='highlight'>1 0 . h H l L p P n N = |</span> and color codes</p>
        <p>3. Color codes are- r g b a m o v y.</p>
        <p>4. Group waves using ["groupName", wave1, wave2]. Nested group is also supported.</p>
        <p>5. use (pattern, count) to repeat. Ex- "=(10, 3)" -> "=101010" This works in wave property</p>
        <p>6. use ud/ux/ub/dd/dx/db(baseValue, count) or (baseValue, count, interval) for up and down count in decimal, hex or binary. Ex- "ux(5,5)" -> "5 6 7 8 9". Works in data property</p>
        <p>7. The green box over the add new button? turns RED if you enter incorrect code.</p>
      </div>
    </div>
  );
};

export default CollapsibleRightTab;
