import React, { useState } from 'react';

const CollapsibleRightTab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelWidth = 450;

  return (
    <div
      style={{
        position: 'fixed',
        top: '540px',
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
          backgroundColor: '#f1f1f1',
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
        <p>1. Add new button to add new signals</p>
        <p>2. You can change the tab names (try double click)</p>
        <p>3. The green box over the add new button? turns red if you enter incorrect code</p>
        <p>4. Format code with auto-format</p>
        <p>5. use (pattern, count) to repeat. 10(., 5) ==> 10.....</p>
        <p>6. Color codes are- r g b a m o v y</p>
      </div>
    </div>
  );
};

export default CollapsibleRightTab;
