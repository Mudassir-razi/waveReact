import React, { useState, useEffect } from 'react';

const EditableLabel = ({
  id,
  text,
  selectionIndex,
  selectClass,
  normalClass,
  onClick,
  onSave,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(text);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // ✅ Sync local input state with prop changes
  useEffect(() => {
    setInputValue(text);
  }, [text]);

  const handleLabelClick = () => {
    onClick(id);
  };

  const handleLabelDoubleClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSave(id, inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onSave(id, inputValue);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowContextMenu(true);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDelete = () => {
    onDelete(id);
    setShowContextMenu(false);
  };

  const handleClickOutside = () => {
    setShowContextMenu(false);
  };

  const commonStyles = {
    display: 'inline-block',
    padding: '4px 8px',
    margin: 0,
    lineHeight: '1.5',
    fontSize: '14px',
    border: 'none',
    boxSizing: 'border-box',
    height: '24px',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={selectionIndex === id ? selectClass : normalClass}
          style={{
            ...commonStyles,
            textAlign: 'left',
            width: `${Math.max(inputValue.length * 8, 50)}px`,
          }}
        />
      ) : (
        <label
          onClick={handleLabelClick}
          onDoubleClick={handleLabelDoubleClick}
          onContextMenu={handleContextMenu}
          className={selectionIndex === id ? selectClass : normalClass}
          style={commonStyles}
        >
          {inputValue}
        </label>
      )}
      {showContextMenu && (
        <div
          style={{
            position: 'absolute',
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000,
            padding: '5px',
          }}
          onClick={handleClickOutside}
        >
          <button
            onClick={handleDelete}
            style={{
              background: 'none',
              border: 'none',
              padding: '5px 10px',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableLabel;
