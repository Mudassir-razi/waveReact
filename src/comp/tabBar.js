import { useEffect } from "react";
import LabelInput from "./labelInput";

const style = {
  width : 'auto',
  height: '100%',
  backgroundColor: 'red',
}

export default function TabBar({ tabs, selectionIndex, onClick, onSave, onAddDown, onDelete }) {
  return (
    <div className="tab-bar" style={{ display: 'flex', alignItems: 'center' }}>
      <button style={{width : 'auto', height: '100%', backgroundColor: 'black', border:'0'}} id="1209" onClick={() => onDelete()}>
        ➖
      </button>
      {tabs.map((tab, index) => (
        <LabelInput
          key={index}
          id={index}
          text={tab.name}
          selectionIndex={selectionIndex}
          onClick={() => onClick(index)}
          onSave={onSave}
          normalClass="tab-label"
          selectClass="tab-label-selected"
        />
      ))}
      <button style={{width : 'auto', height: '100%', backgroundColor: 'black', border:'0'}} id="1209" onClick={() => onAddDown()}>
        ➕
      </button>
    </div>
  );
}