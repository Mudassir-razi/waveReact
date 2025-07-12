import React, { useState } from 'react';

function CollapsibleTab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ width: 300, fontFamily: 'Arial, sans-serif' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#eee',
          cursor: 'pointer',
          padding: '10px',
          border: '1px solid #ccc',
          fontWeight: 'bold',
          userSelect: 'none'
        }}
      >
        Click to toggle
      </div>
      <div
        style={{
          maxHeight: isOpen ? 200 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          border: '1px solid #ccc',
          borderTop: 'none',
          padding: isOpen ? '10px' : '0 10px',
          backgroundColor: '#fafafa'
        }}
      >
        <p>This is the collapsible text inside the tab.</p>
        <p>You can put any HTML content here.</p>
      </div>
    </div>
  );
}

export default CollapsibleTab;
