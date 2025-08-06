
import { settings } from "./config.js";
import { useEffect, useRef } from "react";

export default function Grid({dx, dy, mouse, prevMouse, dragging, offsetX, offsetY, timeStamp, signalCount}){

    const BGcanvasRef = useRef(null);
    
    useEffect(() => {
        const svg_bg_canvas = BGcanvasRef.current;

    }, [dx, dy, mouse, prevMouse, dragging, offsetX, offsetY, timeStamp, signalCount]);

    const gridLines = Array.from({ length: timeStamp }, (_, i) => {
        const x = i * dx;
        return (
        <line
            key={i}
            x1={x + 0.5}
            y1={0.5}
            x2={x + 0.5}
            y2={signalCount * (dy + offsetY) + 0.5}
            stroke="gray"
            strokeOpacity={0.25}
            strokeWidth={1}
            strokeDasharray="4 4"
            pointerEvents="none"
        />
        );
    });

    return(
        <svg
        id="grid"
        ref={BGcanvasRef}
        width={timeStamp * dx} 
        height={signalCount * (dy + offsetY) + 5}
        style={{ position: "absolute", top: 0, left: offsetX, zIndex: 1, backgroundColor:"transparent"}}>
            {gridLines}
        </svg>
    );
}