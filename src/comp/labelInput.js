import React, { useState } from 'react';

const EditableLabel = ({
  id,
  text,
  selectionIndex,
  selectClass,
  normalClass,
  onClick,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(text);

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

  return isEditing ? (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      style={{ textAlign: 'left', display: 'block' }}
      className={selectionIndex === id ? selectClass : normalClass}
    />
  ) : (
    <label
      key={id}
      onClick={handleLabelClick}
      onDoubleClick={handleLabelDoubleClick}
      className={selectionIndex === id ? selectClass : normalClass}
      
    >
      {inputValue}
    </label>
  );
};

export default EditableLabel;
