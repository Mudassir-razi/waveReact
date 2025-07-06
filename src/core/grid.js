
import { settings } from "./config.js";
import { useEffect, useRef } from "react";

export default function Grid({dx, dy, mouse, prevMouse, dragging, offsetY, timeStamp, signalCount}){

    const BGcanvasRef = useRef(null);
    
    useEffect(() => {
        const svg_bg_canvas = BGcanvasRef.current;

    }, [dx, dy, mouse, prevMouse, dragging, timeStamp, signalCount, offsetY]);

    const gridLines = Array.from({ length: timeStamp }, (_, i) => {
        const x = i * dx;
        return (
        <line
            key={i}
            x1={x}
            y1={0}
            x2={x}
            y2={signalCount * (dy + offsetY)}
            stroke="gray"
            strokeOpacity={0.25}
            strokeWidth={0.5}
            strokeDasharray="4 4"
            pointerEvents="none"
        />
        );
    });

    return(
        <svg
        ref={BGcanvasRef}
        width={timeStamp * dx} 
        height={signalCount * (dy + offsetY) + 5}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} 
        >
            {gridLines}
            <line
                x1={dragging ? prevMouse[0] * dx : mouse[0] * dx}
                y1={0}
                x2={dragging ? prevMouse[0] * dx : mouse[0] * dx}
                y2={(signalCount * (dy + offsetY) + 5)}
                stroke={"black"}
                strokeOpacity={0.25}
                strokeWidth={2}
                pointerEvents="none" // does not block mouse events
            />
            <line
                x1={(mouse[0]+1) * dx}
                y1={0}
                x2={(mouse[0]+1) * dx}
                y2={(signalCount * (dy + offsetY) + 5)}
                stroke={"black"}
                strokeWidth={2}
                strokeOpacity={0.25}
                pointerEvents="none" // does not block mouse events
            />

            <rect
                x={0}
                y={mouse[1] * (dy + offsetY)}
                width={timeStamp * dx}
                height={(dy + offsetY) + 5}
                fill="rgba(10, 10, 10, 0.1)"
                pointerEvents="none" // allows mouse events to pass through
            />

        </svg>
    );
}