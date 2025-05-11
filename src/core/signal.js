
import { useEffect, useRef } from "react";

//returns the main layer of the canvas, with all the signals rendered onto it
export default function SignalWindow({signals, renderSequence, dx, dy, offsetY, timeStamp, signalCount, onDown, onMove, onUp})
{
  const signalWindowRef = useRef(null);

  //handles mouse events, returns mouse click position index
  useEffect(()=>{
    const mainCanvas = signalWindowRef.current;

    function handleMouseDown(event) {
      const rect = mainCanvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / dx);
      const y = Math.floor((event.clientY - rect.top) / (dy + offsetY));
      onDown({x, y});
    }
  

    function handleMouseMove(event)
    {
      const rect = mainCanvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / dx);
      const y = Math.floor((event.clientY - rect.top) / (dy + offsetY));
      onMove({x, y});
    }

    function handleMouseUp(event)
    {
      const rect = mainCanvas.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / dx);
      const y = Math.floor((event.clientY - rect.top) / (dy + offsetY));
      onUp({x, y})
    }

    mainCanvas.addEventListener("mousedown", handleMouseDown);
    mainCanvas.addEventListener("mousemove", handleMouseMove);
    mainCanvas.addEventListener("mouseup", handleMouseUp);
  
  
    return () => {
      mainCanvas.removeEventListener("mousedown", handleMouseDown);
      mainCanvas.removeEventListener("mousemove", handleMouseMove);
      mainCanvas.removeEventListener("mouseup", handleMouseUp);
    };
    }, [onDown, onMove, onUp, dx, dy, signalCount, offsetY]);

  //Renders the signals on the canvas  
  useEffect(()=>{
    const mainCanvas = signalWindowRef.current;
    renderAllSignals(mainCanvas, renderSequence, signals, dx, dy, timeStamp, signalCount)
  }, [signals, renderSequence, dx, dy, offsetY, timeStamp, signalCount]);


  return(
    <canvas ref={signalWindowRef} id="mainLayer" width={timeStamp * dx} height={signalCount * (dy + offsetY)}/>
  );
}


//renders all the signals on the grid
function renderAllSignals(mainCanvas, sequence, signals, dx, dy, timeStamp, signalCount)
{
    var offsetY = 8;
    console.log("Rendering " + sequence.length + " signals with Settings: dx: " + dx + " dy: " + dy);
    var ctx = mainCanvas.getContext("2d");
    ctx.clearRect(0, 0, dx * timeStamp, (dy + offsetY)* signalCount);
    ctx.strokeStyle = "#ffffff";
    for(var i = 0; i < sequence.length; i++){
        var signal = signals[sequence[i]].data;
        renderSignal(ctx, signal, i, parseInt(dx), parseInt(dy), offsetY, signals[i].width);
    }
}

function renderSignal(ctx, data, idx, dx, dy, offsetY, lineWidth)
{
    var posX = 0;
    var posY = (idx + 1)* (dy + offsetY);
    var prevRenderBit;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = lineWidth;
    for(var i = 0; i < data.length; i++){
      var currentBit = data[i];
      var prevBit = i === 0 ? data[i] : data[i-1];

      // if(currentBit === '0')
      // {
      //   switch(prevBit)
      //   {
      //     case '0':
      //     {
      //       //glitch
      //       break
      //     }

      //     case '1':
      //     {
      //       //negedge
      //       break;
      //     }

      //     case '.':
      //     {
      //       //conditional edge
      //       prevRenderBit === '1' ? risingEdge(ctx, posX, posY, dx, dy) : risingEdge(ctx, posX, posY, dx, dy) ;//glitch;
      //       break;
      //     }
      //     default:
      //     {
            
      //     } 
      //   }
      // }

      if(currentBit === '0' && prevBit === '0')
      {
          solid0(ctx, posX, posY, dx, dy);
      }
      else if(currentBit === '1' && prevBit === '1')
      {
          solid1(ctx, posX, posY, dx, dy);
      }
      else if(currentBit === '0' && prevBit === '1')
      {
          fallingEdge(ctx, posX, posY, dx, dy);
      }
      else if(currentBit === '1' && prevBit === '0')
      {
          risingEdge(ctx, posX, posY, dx, dy);
      }
      posX += dx;
    }
}


class Signal
{
    constructor(index){
        this.index = index;
        this.data = '';
        this.text = [];
        this.name = 'Signal ' + index;
        this.lineWidth = 1;
    }

    //Update signal data
    toggleSignal(x)
    {
      var splitData = this.data.split('');
      if(splitData[x] === '0') splitData[x] = '1';
      else if (splitData[x] === '1') splitData[x] = '0';
      this.data = splitData.join('');
    }

    //replace signal bit
    replaceSignal(x, bit)
    {
      if(!bit)return;
      var splitData = this.data.split('');
      splitData[x] = bit;
      this.data = splitData.join('');
    }

}


//Basic coordinate class
class Coordinate {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  
    up(step = 1) {
      return new Coordinate(this.x, this.y + step);
    }
  
    down(step = 1) {
      return new Coordinate(this.x, this.y - step);
    }
  
    right(step = 1) {
      return new Coordinate(this.x + step, this.y);
    }
  
    left(step = 1) {
      return new Coordinate(this.x - step, this.y);
    }
  
    toString() {
      return `(${this.x}, ${this.y})`;
    }
  
    distanceTo(other) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  
    equals(other) {
      return this.x === other.x && this.y === other.y;
    }
  }
  
  
//Draws line between from and to coordinates. 
function line(ctx, from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

//solid 0
function solid0(ctx, x, y, dx, dy)
{
    var p1 = new Coordinate(x, y);
    var p2 = p1.right(dx);
    line(ctx, p1, p2);
}
//solid 1
function solid1(ctx, x, y, dx, dy)
{
    var p1 = new Coordinate(x, y);
    p1     = p1.down(dy);
    var p2 = p1.right(dx);
    line(ctx, p1, p2);
}


// Draws rising edge at (x,y)
function risingEdge(ctx, x, y, dx, dy)
{
    var dx1 = dx/8;
    var p1 = new Coordinate(x, y);
    var p2 = p1.right(dx1);
    var p3 = p2.right(dx1).down(dy);
    var p4 = p3.right(dx-2*dx1);

    line(ctx, p1, p2);
    line(ctx, p2, p3);
    line(ctx, p3, p4);
}

// Draws falling edge at (x,y)
function fallingEdge(ctx, x, y, dx, dy)
{   
    var dx1 = dx/8;
    var p1 = new Coordinate(x, y-dy);
    var p2 = p1.right(dx1);
    var p3 = p2.right(dx1).up(dy);
    var p4 = p3.right(dx-2*dx1);

    line(ctx, p1, p2);
    line(ctx, p2, p3);
    line(ctx, p3, p4);
}

// Draws __/# at (x,y)
function fanoutUp(ctx, x, y, dx, dy)
{
    var p1 = new Coordinate(x, y);
    risingEdge(ctx, x, y);
    line(ctx, p1, p1.right(dx));
}

// Draws --\# at (x, y)
function fanoutDown(ctx, x, y, dx, dy)
{
    var p1 = new Coordinate(x, y-dy);
    fallingEdge(ctx, x, y);
    line(ctx, p1, p1.right(dx));
}