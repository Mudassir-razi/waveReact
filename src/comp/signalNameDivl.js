//import SignalSelector from "./signalSelector";

import LabelInput from "./labelInput";
import Button from "./button";


export default function SignalNameDiv({signals, selectionIndex, Click, onAddButton}){

    return(
        <div id="signal-names">
            {signals.map((signal, index) => (
                <LabelInput key={index} id={index} selectionIndex={selectionIndex} onClick={Click} normalClass="signal-label" selectClass="signal-label-selected" text={signal.name}/>//<label className={selectionIndex === id ? "signal-label-selected" : "signal-label" } key={id} name={signals[id].name} onClick={() => {Click(id)}}>{signals[id].name}</label>
            ))}
            <Button className="button-6" text="+" onClick={() => onAddButton()} />
        </div>
    );

}