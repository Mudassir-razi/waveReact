
import { useEffect, useRef } from "react";
const div = 4;
//coordinate lookup table

const busColorScheme = {

  '=' : 'white',
  'a' : 'grey',
  'b' : '#9fd5f5',
  'c' : '#a2fad1',
  'o' : '#ffca7a',
  'y' : '#ebf5a4',
  'g' : '#b5ebb2',
  'r' : '#e88b8b',
  'v' : '#f0c9f2',
  'm' : '#edeca6'
};

//returns the main layer of the canvas, with all the signals rendered onto it
export default function SignalWindow({signals, dx, dy, timeStamp, signalCount, offsetX, offsetY, onDown, onMove, onUp})
{
  const signalWindowRef = useRef(null);

  //Renders the signals on the canvas  
  useEffect(()=>{
    const mainCanvas = signalWindowRef.current;
    renderAllSignals(mainCanvas, signals, dx, dy, offsetY);
  }, [signals, dx, dy, offsetX, offsetY, timeStamp, signalCount, onDown, onMove, onUp]);


  return(
      <svg 
      ref={signalWindowRef} 
      id="mainLayer" 
      width={timeStamp * dx} 
      height={signalCount * (dy + offsetY) + 5} 
      viewBox={`0 0 ${timeStamp * dx} ${signalCount * (dy + offsetY) + 5}`}
      style={{ position: "absolute", top: 0, left: offsetX, zIndex: 2, backgroundColor: "transparent" }}
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
function renderAllSignals(svg_canvas, signals, dx, dy, offsetY)
{
    svg_canvas.innerHTML = ''; // Clear previous content
    //console.log("Rendering " + sequence.length + " signals with Settings: dx: " + dx + " dy: " + dy);
    for(var i = 0; i < signals.length; i++){
        if(Object.keys(signals[i]).includes('space'))continue;
        var name = signals[i].name;
        var signal = signals[i].wave;
        var data = signals[i].data;
        renderSignal(svg_canvas, name, signal, data, i, parseInt(dx), parseInt(dy), offsetY, signals[i].width);
    }
}

function renderSignal(ctx, name, wave, data, idx, dx, dy, offsetY, lineWidth)
{

  //For signal lines
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  //For signal shapes (buses)
  const busShapes = [] ;
  const busColors = [] ;
  //For in-signal texts
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  
  var points = '';
  var shapes = '';
  var texts =  [];
  var shapeStarted = false;


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
      if(compare === '0' || compare === 'p')points += getWave('pos', i * dx, idx * (dy+offsetY), LUT);
      else if(compare === '1' || compare === 'n') points += getWave('1g', i * dx, idx * (dy+offsetY), LUT);
      else if(Object.keys(busColorScheme).includes(compare))
      {
        shapes += getWave('bus1', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);
        points += getWave('Lbus1', i * dx , idx * (dy+offsetY), LUT);

      }
      shapeStarted = false; 
      last = '1';
    }
    
    else if (current === '0')
    {
      compare = prev === '.' ? last : prev;
      if(compare === '1' || compare === 'n')points += getWave('neg', i * dx , idx * (dy+offsetY), LUT);
      else if(compare === '0' || compare === 'p') points += getWave('0g', i * dx , idx * (dy+offsetY), LUT);
      else if(Object.keys(busColorScheme).includes(compare)) 
      {
        shapes += getWave('bus0', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);
        points += getWave('Lbus0', i * dx , idx * (dy+offsetY), LUT);
      }
      shapeStarted = false;
      last = '0';
    }

    //For clock positive edge
    else if( current === 'p')
    {
      points += getWave('p', i * dx , idx * (dy+offsetY), LUT);
      last = 'p'
    }

    else if( current === 'n')
    {
      points += getWave('n', i * dx , idx * (dy+offsetY), LUT);
      last = 'n';
    }

    //if current is a bus '='
    else if (Object.keys(busColorScheme).includes(current))
    {
      compare = prev === '.' ? last : prev;
      if(compare === '1' || compare === 'n')
      {
        shapes = getWave('1bus', i * dx , idx * (dy+offsetY), LUT);
        points += getWave('L1bus', i * dx , idx * (dy+offsetY), LUT);
      }
      else if(compare === '0' || compare === 'p')
      { 
        shapes = getWave('0bus', i * dx  , idx * (dy+offsetY), LUT);
        points += getWave('L0bus', i * dx  , idx * (dy+offsetY), LUT);
      }
      else if(Object.keys(busColorScheme).includes(compare))
      {
        
        //close previous shape
        shapes += getWave('bustS', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);

        shapes = getWave('bustE', i * dx  , idx * (dy+offsetY), LUT);
        points += getWave('Lbust', i * dx  , idx * (dy+offsetY), LUT);
      }

      //push colors
      busColors.push(busColorScheme[current]);

      //add text
      try{
        var busLen = 0;
        var j = i;
        while(wave[j+1] === '.')
        {
          busLen++;
          j++;
        }
        const t1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        t1.setAttribute("x", i*dx + dx*0.70 + busLen*14);
        t1.setAttribute("y", idx * (dy+offsetY) + 1.10*dy);
        t1.textContent = `${dataIndex < data.split(' ').length ? data.split(' ')[dataIndex] : ' '}`;
        texts.push(t1);
        dataIndex++;
      }
      catch (e)
      {
        console.log("No data available");
      }
      shapeStarted = true;
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
      else if(last === 'p')
      {
        points += getWave('p', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(last === 'n')
      {
        points += getWave('n', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(Object.keys(busColorScheme).includes(last))
      {
        shapes += getWave('bus', i * dx , idx * (dy+offsetY), LUT);
        points += getWave('Lbus', i * dx , idx * (dy+offsetY), LUT);
      }
      
    }
  }
  if(shapeStarted) busShapes.push(shapes);


  text.setAttribute("x", 0);
  text.setAttribute("y", 0);
  text.setAttribute("fill", "black");
  text.setAttribute("font-family", "monospace");
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
  path.setAttribute("shapreRendering", "crispEdges");


  //applying shapes
  var colorIdx = 0;
  busShapes.forEach(element => {
    const busShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    busShape.setAttribute("d", element);
    busShape.setAttribute("stroke", "none");
    busShape.setAttribute("fill", busColors[colorIdx]);
    busShape.setAttribute("fill-opacity", "0.5");
    ctx.appendChild(busShape);
    colorIdx++;
  });

  // path2.setAttribute("d", shapes);
  // path2.setAttribute("stroke", "none");
  // path2.setAttribute("fill", "skyblue");
  // path2.setAttribute("fill-opacity", "0.5");

  //ctx.appendChild(path2);
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
  else if(segment === 'p')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${Math.floor((offsetX+LUT[5].x + offsetX+LUT[8].x)/2)} ${offsetY+LUT[7].y} L${Math.floor((offsetX+LUT[5].x + offsetX+LUT[8].x)/2)} ${offsetY+LUT[2].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}`;
  }
  else if(segment === 'n')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${Math.floor((offsetX+LUT[5].x + offsetX+LUT[8].x)/2)} ${offsetY+LUT[0].y} L${Math.floor((offsetX+LUT[5].x + offsetX+LUT[8].x)/2)} ${offsetY+LUT[5].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}`;
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
  else if(segment === 'bustS')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} z`;
  }
  else if(segment === 'bustE')
  {
    return `M${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} z`;
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

//Look-up table for the points on the signal segment
function GetLUT(dx, dy, div, offsetY)
{
  var dx1 = Math.floor(0.5 * dx/div) + 0.5;
  var dx2 = Math.floor(0.75 * dx/div) + 0.5;
  var dx3 = dx - (dx1 + dx2) + 0.5;
  var bo = offsetY + 0.5;
  var lut = [{x:0, y:bo+dy}, {x:dx1, y:bo+dy}, {x:dx1+dx2, y:bo+dy}, {x:dx1+dx2+dx3, y:bo+dy}, {x:dx1+dx2/2, y:bo+dy/2},
  {x:0, y:bo}, {x:dx1, y:bo}, {x:dx1+dx2, y:bo}, {x:dx1+dx2+dx3, y:bo}];

  return lut;
}


//evaluates string
function evaluateExpression(expr) {
  try {
    const fn = new Function(`return (${JSON.stringify(expr)});`);
    return fn();
  } catch (e) {
    return `Error: ${e.message}`;
  }
}
