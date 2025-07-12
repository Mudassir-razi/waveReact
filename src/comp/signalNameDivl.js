//import SignalSelector from "./signalSelector";

import LabelInput from "./labelInput";
import Button from "./button";


export default function SignalNameDiv({signals, dy, offsetX, offsetY, signalCount, selectionIndex, Click}){

    return(

        <svg 
        id="nameList"
        width={offsetX} 
        height={(dy+offsetY) * signalCount + 10} 
        style={{ position: "absolute", top: 0, left: 0, zIndex: 3, backgroundColor: "white" }}
        >
            {signals.map((signal, index) => (
                (Object.keys(signal).includes('name'))&&(<text className="signal-label" x={offsetX - signal.name.length * 9 - 12} y={index * (dy + offsetY) + 0.90*dy} textAnchor="left" fill="blue" key={index}> {signal.name} </text>)
            ))}
        </svg>
    );

}