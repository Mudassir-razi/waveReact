
import { useEffect, useRef } from "react";
const div = 8;
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
    var prevRenderBit=data[0];
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = lineWidth;
    for(var i = 0; i < data.length;i++){
      //console.log(i);
      var currentBit = data[i];
      var prevBit = i === 0 ? data[i] : data[i-1];

      if(currentBit === '0')
      {
        switch(prevBit)
        {
          case '0':
          {
            glitch0(ctx, posX, posY, dx, dy);
            break
          }

          case '1':
          {
            fallingEdge(ctx, posX, posY, dx, dy);
            break;
          }

          case '=':
          {
            fallingEdge(ctx, posX, posY, dx, dy);
            break;
          }

          case '.':
          {
            //conditional edge
            if(prevRenderBit === '1')fallingEdge(ctx, posX, posY, dx, dy);
            
            else if(prevRenderBit === '0')glitch0(ctx, posX, posY, dx, dy);
            
            else if(prevRenderBit === '=')
            {
              fallingEdge(ctx, posX, posY, dx, dy);
              solid0(ctx, posX, posY, dx, dy);
            }
            break;
          }
          default:
          {
            
          } 
        }
      }
      else if(currentBit === '1')
      {
        switch(prevBit)
        {
          case '0':
          {
            risingEdge(ctx, posX, posY, dx, dy);
            break
          }

          case '1':
          {
            glitch1(ctx, posX, posY, dx, dy);
            break;
          }

          case '=':
          {
            risingEdge(ctx, posX, posY, dx, dy);
            break;
          }

          case '.':
          {
            //conditional edge
            //conditional edge
            if(prevRenderBit === '1')glitch0(ctx, posX, posY, dx, dy);
            
            else if(prevRenderBit === '0')risingEdge(ctx, posX, posY, dx, dy);
            
            else if(prevRenderBit === '=')
            {
              risingEdge(ctx, posX, posY, dx, dy);
              solid1(ctx, posX, posY, dx, dy);
            }
            break;
          }
          default:
          {
            
          } 
        }
      }

      else if(currentBit === '=')
      {
        const dx1 = dx/div;
        var nextBit = i+1 < data.length ? data[i+1] : '|';
        var rep = 0;
        for(var k = 1;k+i < data.length;k++)
        {
          if(data[i+k] === '.')
          {
            prevRenderBit = '=';
            nextBit = k+i+1 < data.length ? data[k+i+1] : '|';
            rep++;
          }
          else 
          {
            break;
          }
        }
        console.log(nextBit);
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        
        //Zero case
        if(prevBit === '0' || (prevBit === '.' && prevRenderBit === '0'))
        {
          ctx.lineTo(posX + dx1, posY);
          ctx.lineTo(posX + 2*dx1, posY - dy);
          ctx.lineTo(posX + (1+rep)*dx + dx1, posY - dy);
          if(nextBit === '0')
          {
            ctx.lineTo(posX + (1+rep)*dx + 2*dx1, posY);
            ctx.lineTo(posX+dx1, posY);
          }
          else if(nextBit === '1')
          {
            ctx.lineTo(posX + (1+rep)*dx + 2*dx1, posY-dy);
            ctx.lineTo(posX + (1+rep)*dx + dx1, posY);
            ctx.lineTo(posX+dx1, posY);
          }
          else if(nextBit === '=')
          {
            ctx.lineTo(posX + (1+rep)*dx + dx1 + dx1/2, posY-dy/2);
            ctx.lineTo(posX + (1+rep)*dx + dx1 , posY);
            ctx.lineTo(posX+dx1, posY);
          }

          else if(nextBit === '|')
          {
            ctx.lineTo(posX + (1+rep)*dx + dx1, posY);
            ctx.lineTo(posX + dx1, posY);
            ctx.lineTo(posX+dx1, posY);
          }
          ctx.fill();
          ctx.stroke();
          ctx.closePath();
        }

        //one case
        else if(prevBit === '1' || (prevBit === '.' && prevRenderBit === '1'))
        {
          ctx.moveTo(posX, posY-dy);
          ctx.lineTo(posX + dx1, posY-dy);
          ctx.lineTo(posX + 2*dx1, posY);
          ctx.lineTo(posX + (1+rep)*dx + dx1, posY);
          if(nextBit === '0')
          {
            ctx.lineTo(posX + (1+rep)*dx + 2*dx1, posY);
            ctx.lineTo(posX + (1+rep)*dx + dx1, posY-dy);
            ctx.lineTo(posX+dx1, posY-dy);
          }
          else if(nextBit === '1')
          {
            ctx.lineTo(posX + (1+rep)*dx + 2*dx1, posY-dy);
            ctx.lineTo(posX+dx1, posY-dy);
          }
          else if(nextBit === '=')
          {
            ctx.lineTo(posX + (1+rep)*dx + dx1 + dx1/2, posY-dy/2);
            ctx.lineTo(posX + (1+rep)*dx + dx1 , posY-dy);
            ctx.lineTo(posX+dx1, posY-dy);
          }
          else if(nextBit === '|')
          {
            ctx.lineTo(posX + (1+rep)*dx + dx1, posY-dy);
            ctx.lineTo(posX + dx1, posY-dy);
            ctx.lineTo(posX+dx1, posY-dy);
          }
          ctx.fill();
          ctx.stroke();
          ctx.closePath();
        }

        //multibit case
        else if(prevBit === '=' || (prevBit === '.' && prevRenderBit === '='))
        {
          ctx.moveTo(posX+dx1 + dx1/2, posY-dy/2);
          ctx.lineTo(posX + 2*dx1, posY);
          ctx.lineTo(posX + (1+rep)*dx + dx1, posY);
          if(nextBit === '0')
          {
            ctx.lineTo(posX + (1+rep)*dx + 2*dx1, posY);
            ctx.lineTo(posX + (1+rep)*dx + dx1, posY-dy);
            ctx.lineTo(posX+2*dx1, posY-dy);
            ctx.lineTo(posX+dx1+dx1/2, posY-dy/2);
          }
          else if(nextBit === '1')
          {
            ctx.lineTo(posX + (1+rep)*dx + 2*dx1, posY-dy);
            ctx.lineTo(posX+2*dx1, posY-dy);
            ctx.lineTo(posX+dx1+dx1/2, posY-dy/2);
          }
          else if(nextBit === '=')
          {
            ctx.lineTo(posX + (1+rep)*dx + dx1 + dx1/2, posY-dy/2);
            ctx.lineTo(posX + (1+rep)*dx + dx1 , posY-dy);
            ctx.lineTo(posX+2*dx1, posY-dy);
            ctx.lineTo(posX+dx1+dx1/2, posY-dy/2);
          }
           else if(nextBit === '|')
          {
            ctx.lineTo(posX + (1+rep)*dx + dx1, posY-dy);
            ctx.lineTo(posX+2*dx1, posY-dy);
            ctx.lineTo(posX+dx1+dx1/2, posY-dy/2);
          }

          ctx.fill();
          ctx.stroke();
          ctx.closePath();
        }
        i = i + rep;
        posX += dx*rep;
      }
      else if (currentBit === '.')
      {
        prevRenderBit = prevBit;
        var currentBit2 = currentBit;
        //var nextBit = i >= data.length ? prevBit : data[i+1];
        for(var j = 0; j+i < data.length;j++)
        {
          currentBit2 = data[i+j];
          if(currentBit2 !== '.')break;
          switch(prevRenderBit)
          {
            case '0':
            {
              solid0(ctx, posX, posY, dx, dy);
              break
            }

            case '1':
            {
              solid1(ctx, posX, posY, dx, dy);
              break;
            }
            default:
            {
              
            }
          }
          posX += dx;
        }
        i = i + j-1;
        posX -= dx;
      }
      posX += dx;
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
    ctx.closePath();
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

//glitch0
function glitch0(ctx, x, y, dx, dy)
{
    var dx1 = dx/div;
    var p1 = new Coordinate(x, y);
    var p2 = p1.right(dx);
    var p3 = p1.right(dx1);
    var p4 = p3.right(dx1).down(dx1*2);
    var p5 = p3.right(dx1*2);
    line(ctx, p1, p3);
    line(ctx, p3, p4);
    line(ctx, p4, p5);
    line(ctx, p5, p2);
}

//glitch1
function glitch1(ctx, x, y, dx, dy)
{
    var dx1 = dx/div;
    var p1 = new Coordinate(x, y);
    p1 = p1.down(dy);
    var p2 = p1.right(dx);
    var p3 = p1.right(dx1);
    var p4 = (p3.right(dx1)).up(dx1*2);
    var p5 = (p3.right(dx1*2));
    line(ctx, p1, p3);
    line(ctx, p3, p4);
    line(ctx, p4, p5);
    line(ctx, p5, p2);
}

// Draws rising edge at (x,y)
function risingEdge(ctx, x, y, dx, dy)
{
    var dx1 = dx/div;
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
    var dx1 = dx/div;
    var p1 = new Coordinate(x, y-dy);
    var p2 = p1.right(dx1);
    var p3 = p2.right(dx1).up(dy);
    var p4 = p3.right(dx-2*dx1);

    line(ctx, p1, p2);
    line(ctx, p2, p3);
    line(ctx, p3, p4);
}

// Draws multibit signal cap
function dataCap(ctx, x, y, dx, dy, type)
{   
  var dx1 = dx/div;
  //data to data
  if(type === 0)
  {
    var p1 = new Coordinate(x, y-dy);
    var p2 = p1.right(dx1);
    var p3 = p2.right(dx1/2).down(dy/2);
    var p4 = p2.down(dy);
    var p5 = p1.down(dy);
    line(ctx, p1, p2);
    line(ctx, p2, p3);
    line(ctx, p3, p4);
    line(ctx, p4, p5);
  }

}