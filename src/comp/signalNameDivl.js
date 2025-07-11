//import SignalSelector from "./signalSelector";

import LabelInput from "./labelInput";
import Button from "./button";


export default function SignalNameDiv({signals, dy, offsetX, offsetY, signalCount, selectionIndex, Click}){

    return(

        <svg 
        width={offsetX} 
        height={(dy+offsetY) * signalCount} 
        style={{ position: "absolute", top: 0, left: 0, zIndex: 3, backgroundColor: "transparent" }}
        >
            {signals.map((signal, index) => (
                <text className="signal-label" x={offsetX - signal.name.length * 9 - 12} y={index * (dy + offsetY) + 0.90*dy} textAnchor="left" fill="blue" key={index}> {signal.name} </text>//<LabelInput key={index} id={index} selectionIndex={selectionIndex} onClick={Click} normalClass="signal-label" selectClass="signal-label-selected" text={signal.name}/>/
            ))}
        </svg>
    );

}