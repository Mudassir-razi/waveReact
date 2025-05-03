//import SignalSelector from "./signalSelector";
import { useEffect } from "react";

export default function SignalLabel({signals, Click}){

    useEffect(() => {
        const handleKeyDown = (event) => {
          console.log("Global key press:", event.key);
        };
    
        window.addEventListener("keydown", handleKeyDown);
    
        return () => {
          window.removeEventListener("keydown", handleKeyDown); // Cleanup
        };
      }, []);
    
    return(
        <div id="signal-names">
            {signals.map((signal, index) => (
                <label className="signal-label" key={index} name={signal.name} onClick={() => {Click(index)}}>{signal.name}</label>
            ))}
        </div>
    );

}