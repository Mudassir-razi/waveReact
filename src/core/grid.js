
import { settings } from "./config.js";
import { useEffect, useRef } from "react";

export default function Grid({dx, dy, offsetY, timeStamp, signalCount}){

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

         //horizontal lines
        // for(var i = 0; i <= signalCount; i++){
        //     var y = i * ( dy + settings.offsetY);
        //     ctx.beginPath();
        //     ctx.setLineDash([5, 5])
        //     ctx.moveTo(0, y);
        //     ctx.lineTo(width, y);
        //     ctx.stroke();
        // }

        //vertical lines
        for(var i = 0; i <= timeStamp; i++){
            var x = i * dx;
            ctx.beginPath();
            ctx.setLineDash([5, 5])
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

    }, [dx, dy, timeStamp, signalCount, offsetY]);

    return(
        <canvas ref={canvasRef} id="bgLayer" width={timeStamp * dx} height={signalCount * (dy + offsetY)} style={{backgroundColor: settings.bgColor}}></canvas>
    );
}