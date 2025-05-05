
import { settings } from "./config.js";
import { useEffect, useRef } from "react";

export default function Grid({dx, dy, mouse, prevMouse, dragging, offsetY, timeStamp, signalCount}){

    const canvasRef = useRef(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const width = timeStamp * dx;
        const height = signalCount * (dy + offsetY);
        canvas.width = width + 2;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = settings.gridColor;
        ctx.strokeStyle = settings.gridColor;

        //horizontal rect
        // for(var i = 0; i <= signalCount; i++){
        //     var y = i * ( dy + settings.offsetY);
        //     ctx.beginPath();
        //     ctx.setLineDash([5, 5])
        //     ctx.moveTo(0, y);
        //     ctx.lineTo(width, y);
        //     ctx.stroke();
        // }
        
        ctx.beginPath();
        ctx.rect(0, mouse[1] * (dy + offsetY), dx * timeStamp, dy+offsetY);
        ctx.fillStyle="rgba(255, 255, 255, 0.10)";
        ctx.fill();
        //vertical lines
        for(var i = 0; i <= timeStamp; i++){
            var x = i * dx;
            if(!dragging)ctx.lineWidth = i === mouse[0] || i === mouse[0] + 1 ? 2 : 1;
            else ctx.lineWidth = i === mouse[0]+1 || i === prevMouse[0] ? 3 : 1;
            ctx.beginPath();
            ctx.setLineDash([5, 5])
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

    }, [dx, dy, mouse, prevMouse, dragging, timeStamp, signalCount, offsetY]);

    return(
        <canvas ref={canvasRef} id="bgLayer" width={timeStamp * dx} height={signalCount * (dy + offsetY)} style={{backgroundColor: settings.bgColor}}></canvas>
    );
}