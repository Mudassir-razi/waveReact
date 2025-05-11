//import SignalSelector from "./signalSelector";

import LabelInput from "./labelInput";
import Button from "./button";


export default function SignalNameDiv({signals, renderSequence, selectionIndex, Click, onAddButton}){

    return(
        <div id="signal-names">
            {renderSequence.map((id, index) => (
                <LabelInput key={id} id={id} selectionIndex={selectionIndex} onClick={Click} normalClass="signal-label" selectClass="signal-label-selected" text={signals[id].name}/>//<label className={selectionIndex === id ? "signal-label-selected" : "signal-label" } key={id} name={signals[id].name} onClick={() => {Click(id)}}>{signals[id].name}</label>
            ))}
            <Button className="button-6" text="+" onClick={() => onAddButton()} />
        </div>
    );

}