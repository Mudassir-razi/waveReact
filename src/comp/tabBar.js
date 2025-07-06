import { useEffect } from "react";
import LabelInput from "./labelInput";

export default function TabBar({tabs, renderSequence, selectionIndex, onClick, onAddDown}) {

  return (
    <div className="tab-bar">
      {renderSequence.map((id, index) =>(
        <LabelInput key={index} id={id} text={tabs[id].name} selectionIndex={selectionIndex} onClick={() => onClick(id)} normalClass="tab-label" selectClass="tab-label-selected" />
      ))}
      <button id="1209" onClick={() => {onAddDown()}}>+</button>
    </div>
  );
}