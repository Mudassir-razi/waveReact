//import SignalSelector from "./signalSelector";


export default function SignalNameDiv({signals, renderSequence, selectionIndex, Click}){

    return(
        <div id="signal-names">
            {renderSequence.map((id, index) => (
                <label className={selectionIndex === id ? "signal-label-selected" : "signal-label" } key={id} name={signals[id].name} onClick={() => {Click(id)}}>{signals[id].name}</label>
            ))}
        </div>
    );

}