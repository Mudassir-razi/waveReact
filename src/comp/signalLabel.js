import { useState } from 'react';

export default function SignalLabel({ signals, onRename }) {
    const [editingIndex, setEditingIndex] = useState(null);
    const [newName, setNewName] = useState("");
  
    const handleDoubleClick = (index) => {
      setEditingIndex(index);
      setNewName(signals[index].name);
    };
  
    const handleInputChange = (e) => {
      setNewName(e.target.value);
    };
  
    const handleKeyDown = (e, index) => {
      if (e.key === "Enter") {
        onRename(index, newName);       // tell parent to update name
        setEditingIndex(null);          // hide input
      }
    };
  
    return (
      <div id="signal-names">
        {signals.map((signal, index) =>
          editingIndex === index ? (
            <input
              key={index}
              type="text"
              value={newName}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyDown(e, index)}
              autoFocus
              onBlur={() => setEditingIndex(null)} // exit on focus loss
            />
          ) : (
            <label
              key={index}
              className="signal-label"
              onDoubleClick={() => handleDoubleClick(index)}
            >
              {signal.name}
            </label>
          )
        )}
      </div>
    );
  }
  