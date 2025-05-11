import { useEffect } from "react";
import LabelInput from "./labelInput";

export default function TabBar({tabs, renderSequence, selectionIndex, onKeyDown, onClick, onAddDown}) {


//Listens to key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      onKeyDown(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown); // Cleanup
    };
  },);

  return (
    <div className="tab-bar">
      {renderSequence.map((id, index) =>(
        <LabelInput key={index} id={id} text={tabs[id].name} selectionIndex={selectionIndex} onClick={() => onClick(id)} normalClass="tab-label" selectClass="tab-label-selected" />
      ))}
      <button id="1209" onClick={() => {onAddDown()}}>+</button>
    </div>
  );
}