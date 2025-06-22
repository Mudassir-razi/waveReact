
import { useEffect, useRef } from "react";
const div = 8;
//coordinate lookup table



//returns the main layer of the canvas, with all the signals rendered onto it
export default function SignalWindow({signals, renderSequence, dx, dy, offsetY, timeStamp, signalCount, onDown, onMove, onUp})
{
  const signalWindowRef = useRef(null);

  //Renders the signals on the canvas  
  useEffect(()=>{
    const mainCanvas = signalWindowRef.current;
    renderAllSignals(mainCanvas, renderSequence, signals, dx, dy, timeStamp, signalCount)
  }, [signals, renderSequence, dx, dy, offsetY, timeStamp, signalCount]);


  return(
      <svg 
      ref={signalWindowRef} 
      id="mainLayer" 
      width={timeStamp * dx} 
      height={signalCount * (dy + offsetY) + 5} 
      style={{ position: "absolute", top: 0, left: 0, zIndex: 2, backgroundColor: "transparent" }}
      onMouseDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / dx);
        const y = Math.floor((e.clientY - rect.top) / (dy+offsetY));
        onDown({ x, y }); 
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / dx);
        const y = Math.floor((e.clientY - rect.top) / (dy+offsetY));
        console.log("Move");
        onMove({ x, y });
      }}
      onMouseUp={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / dx);
        const y = Math.floor((e.clientY - rect.top) / (dy+offsetY));
        onUp({ x, y });
      }}
    >
    </svg>
  );
}





//renders all the signals on the grid
function renderAllSignals(svg_canvas, sequence, signals, dx, dy, timeStamp, signalCount)
{
    var offsetY = 8;
    svg_canvas.innerHTML = ''; // Clear previous content
    //console.log("Rendering " + sequence.length + " signals with Settings: dx: " + dx + " dy: " + dy);
    for(var i = 0; i < sequence.length; i++){
        var signal = signals[sequence[i]].wave;
        var data = signals[sequence[i]].data;
        renderSignal(svg_canvas, signal, data, i, parseInt(dx), parseInt(dy), offsetY, signals[i].width);
    }
}

function renderSignal(ctx, wave, data, idx, dx, dy, offsetY, lineWidth)
{
  var points = '';
  var shapes = '';
  var texts =  [];

  var last = wave[0] === '1' ? '0' : '1';
  var dataIndex = 0;

  const LUT = GetLUT(dx, dy, div, offsetY);
  for(var i = 0;i < wave.length; i++)
  {
    var current = wave[i];
    var prev = i > 0 ? wave[i-1] : '.';

    if(current === '1')
    {
      var compare = prev === '.' ? last : prev;
      if(compare === '0')points += getWave('pos', i * dx, idx * (dy+offsetY), LUT);
      else if(compare === '1') points += getWave('1g', i * dx, idx * (dy+offsetY), LUT);
      else if(compare === '=')
      {
        shapes += getWave('bus1', i * dx, idx * (dy+offsetY), LUT);
        points += getWave('Lbus1', i * dx, idx * (dy+offsetY), LUT);
      } 
      last = '1';
    }
    
    else if (current === '0')
    {
      compare = prev === '.' ? last : prev;
      if(compare === '1')points += getWave('neg', i * dx, idx * (dy+offsetY), LUT);
      else if(compare === '0') points += getWave('0g', i * dx, idx * (dy+offsetY), LUT);
      else if(compare === '=') 
      {
        shapes += getWave('bus0', i * dx, idx * (dy+offsetY), LUT);
        points += getWave('Lbus0', i * dx, idx * (dy+offsetY), LUT);
      }
        last = '0';
    }
    else if (current === '=')
    {
      compare = prev === '.' ? last : prev;
      if(compare === '1')
      {
        shapes += getWave('1bus', i * dx, idx * (dy+offsetY), LUT);
        points += getWave('L1bus', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(compare === '0')
      { 
        shapes += getWave('0bus', i * dx, idx * (dy+offsetY), LUT);
        points += getWave('L0bus', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(compare === '=')
      {
         shapes += getWave('bust', i * dx, idx * (dy+offsetY), LUT);
         points += getWave('Lbust', i * dx, idx * (dy+offsetY), LUT);
      }

      //add text
      if(data !== null){
        const t1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        t1.setAttribute("x", i*dx+ dx*0.70);
        t1.setAttribute("y", idx * (dy+offsetY) + dy);
        t1.textContent = `${dataIndex < data.split(' ').length ? data.split(' ')[dataIndex] : ' '}`;
        texts.push(t1);
        dataIndex++;
      }
      last = '=';
    }
    else if (current === '.')
    {
      if(last === '1')
      {
        points += getWave('1', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(last === '0')
      { 
        points += getWave('0', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(last === '=')
      {
        shapes += getWave('bus', i * dx, idx * (dy+offsetY), LUT);
        points += getWave('Lbus', i * dx, idx * (dy+offsetY), LUT);
      }
    }
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", 0);
  text.setAttribute("y", 0);
  text.setAttribute("fill", "black");
  text.setAttribute("font-size", "15");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("pointer-events", "none");
  text.setAttribute("class", "dynamic-text");
  texts.forEach(tspan => {
    text.appendChild(tspan);
  });  

  path.setAttribute("d", points);
  path.setAttribute("stroke", "black");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", lineWidth);
  path2.setAttribute("d", shapes);
  path2.setAttribute("stroke", "none");
  path2.setAttribute("fill", "skyblue");
  ctx.appendChild(path2);
  ctx.appendChild(path);
  ctx.appendChild(text);
}

function getWave(segment, offsetX, offsetY, LUT)
{
  if(segment === 'pos')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}`;
  }
  else if(segment === 'neg')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}`;
  }
  else if(segment === '0')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}`;
  }
  else if(segment === '1')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}`;
  }

  //bus shapes
  else if(segment === 'bus')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[0].x} ${offsetY+LUT[0].y} z`;
  }
  else if(segment === '0bus')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}  L${offsetX+LUT[3].x} ${offsetY+LUT[3].y} z`;
  }
  else if(segment === '1bus')
  {
     return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}  L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} z`;
  }
  else if(segment === 'bus0')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[0].x} ${offsetY+LUT[0].y} z`;
  }
  else if(segment === 'bus1')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} z`;
  }
  else if(segment === 'bust')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} z M${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} z`;
  }

  //bus shape ends

  //bus lines
  else if(segment === 'Lbus')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} M${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[0].x} ${offsetY+LUT[0].y} `;
  }
  else if(segment === 'L0bus')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}  M${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y}`;
  }
  else if(segment === 'L1bus')
  {
     return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}  M${offsetX+LUT[8].x} ${offsetY+LUT[8].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y}`;
  }
  else if(segment === 'Lbus0')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y} M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y}`;
  }
  else if(segment === 'Lbus1')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y}`;
  }
  else if(segment === 'Lbust')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}`;
  }

  //bus shape ends
  else if(segment === '0g')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y} `;
  }
  else if(segment === '1g')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}`;
  }
}

function GetLUT(dx, dy, div, offsetY)
{
  var dx1 = dx/div;
  var dx2 = dx/div;
  var dx3 = dx - (dx1 + dx2);
  var bo = offsetY;
  var lut = [{x:0, y:bo+dy}, {x:dx1, y:bo+dy}, {x:dx1+dx2, y:bo+dy}, {x:dx1+dx2+dx3, y:bo+dy}, {x:dx1+dx2/2, y:bo+dy/2},
  {x:0, y:bo}, {x:dx1, y:bo}, {x:dx1+dx2, y:bo}, {x:dx1+dx2+dx3, y:bo}];

  return lut;
}