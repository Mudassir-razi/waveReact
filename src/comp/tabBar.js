import { useEffect } from "react";
import LabelInput from "./labelInput";

export default function TabBar({tabs, selectionIndex, onClick, onSave, onAddDown}) {

  return (
    <div className="tab-bar">
      {tabs.map((tab, index) =>(
        <LabelInput key={index} id={index} text={tab.name} selectionIndex={selectionIndex} onClick={() => onClick(index)} onSave={onSave} normalClass="tab-label" selectClass="tab-label-selected" />
      ))}
      <button style={{ background:"#2f3338", color:"white",border: "0px"}} id="1209" onClick={() => {onAddDown()}}>+</button>
    </div>
  );
}