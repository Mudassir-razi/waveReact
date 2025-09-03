
import { useEffect, useRef } from "react";
const div = 4;
//coordinate lookup table

const patternId = "my-hatch-pattern";
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
  'm' : '#edeca6',
  'x' : `url(#${patternId})`
};

//returns the main layer of the canvas, with all the signals rendered onto it
export default function SignalWindow({signals, dx, dy, timeStamp, signalCount, offsetX, offsetY, onDown, onMove, onUp, viewMode})
{
  const signalWindowRef = useRef(null);

  //Renders the signals on the canvas  
  useEffect(()=>{
    const mainCanvas = signalWindowRef.current;
    renderAllSignals(mainCanvas, signals, dx, dy, offsetY, viewMode);
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

/**
 * renders all the signals on the grid
 * @param {svg} svg_canvas -SVG object to render signals on
 * @param {JSON} signals -JSON objects containing signals
 * @param {int} dx - Horizontal spacing between waveform bits
 * @param {int} dy -Height of the waveform
 * @param {int} offsetY - Offset between waveforms
 */
function renderAllSignals(svg_canvas, signals, dx, dy, offsetY, viewMode)
{
    svg_canvas.innerHTML = ''; // Clear previous content
    //console.log("Rendering " + sequence.length + " signals with Settings: dx: " + dx + " dy: " + dy);

    //Create pattern and defs for hatch pattern
    // Find or create <defs> inside your svg_canvas
    let defs = svg_canvas.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg_canvas.insertBefore(defs, svg_canvas.firstChild);
    }

    // Create pattern and append if not already present
    if (!defs.querySelector(`#${patternId}`)) {
      const pattern = getDiagonalHatchPattern({ id: patternId, stroke : viewMode ? "black" : "white" });
      defs.appendChild(pattern);
    }


    for(var i = 0; i < signals.length; i++){
        if(typeof signals[i] === "object" &&
            signals[i]  !== null &&
            Object.keys(signals[i] ).length === 0 &&
            signals[i].constructor === Object) continue;
        var name = signals[i].name;
        var signal = expandWavePattern(signals[i].wave);
        var data = Object.keys(signals[i]).includes("data") ? expandDataPatterns(signals[i].data) : " ";
        var scale = Object.keys(signals[i]).includes("scale") && signals[i].scale !== " " && signals[i].scale !== ""?  signals[i].scale : 1;
        var color = Object.keys(signals[i]).includes("color") && signals[i].color !== " " && signals[i].color !== ""? darkenHexColor(busColorScheme[signals[i].color],20) : (viewMode ? "black" : "white");
        renderSignal(svg_canvas, signal, data, i, parseInt(dx), parseInt(dy), offsetY, signals[i].width, scale, color, viewMode);
    }
}

function renderSignal(ctx, wave, data, idx, UnscaledDx, dy, offsetY, lineWidth=1, Rawscale=1, lineColor, viewMode)
{

  const parsedInt = parseFloat(Rawscale);
  const scale = isNaN(parsedInt) ? 1 : parsedInt;
  const dx = UnscaledDx * parsedInt;

  //For signal lines
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  //For signal shapes (buses)
  const busShapes = [] ;
  const busColors = [] ;
  //For in-signal texts
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  //Extra direct SVG stuff (rect, poly etc)
  const extras = [];

  var points = '';
  var shapes = '';
  var texts =  [];
  var shapeStarted = false;


  //for now
  var last = wave[0] === '1' ? '0' : '1';
  var dataIndex = 0;

  const LUT = GetLUT(UnscaledDx, dy, div, offsetY, parsedInt, lineWidth);


  for(var i = 0;i < wave.length; i++)
  {
    var current = wave[i];
    var prev = i > 0 ? wave[i-1] : '.';

    //For the exception of the first case
    if(i === 0)
    {
      if(!Object.keys(busColorScheme).includes(current)){
        current = '.';
        prev    = '.';
        last    = wave[0];
      }
    }
    
    if(current === '1')
    {
      var compare = (prev === '.' || prev === '|') ? last : prev;
      if(compare === '0' || compare === 'p' || compare === 'l' || compare === 'P' || compare === 'L')points += getWave('pos', i * dx, idx * (dy+offsetY), LUT);
      else if(compare === '1' || compare === 'n' || compare === 'h' || compare === 'N' || compare === 'H') points += getWave('1g', i * dx, idx * (dy+offsetY), LUT);
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
      compare = (prev === '.' || prev === '|')? last : prev;
      if(compare === '1' || compare === 'n' || compare === 'h' || compare === 'N' || compare === 'H')points += getWave('neg', i * dx , idx * (dy+offsetY), LUT);
      else if(compare === '0' || compare === 'p' || compare === 'l' || compare === 'P' || compare === 'L') points += getWave('0g', i * dx , idx * (dy+offsetY), LUT);
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
    else if( current === 'p' || current === 'P')
    {
      compare = (prev === '.' || prev === '|')? last : prev;
      points += getWave('p', i * dx , idx * (dy+offsetY), LUT);
      if(Object.keys(busColorScheme).includes(compare)) 
      {
        shapes += getWave('busH', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);
      }
      shapeStarted = false;
      if(current === 'P')extras.push(getArrorw(LUT[5], LUT[0], i * dx, idx * (dy+offsetY), 8, viewMode));
      last = current;
      
    }

    //For clock negative edge
    else if( current === 'n' || current === 'N')
    {
      points += getWave('n', i * dx , idx * (dy+offsetY), LUT);
      if(current === 'N')extras.push(getArrorw(LUT[0], LUT[5], i * dx, idx * (dy+offsetY), 8, viewMode));
      if(Object.keys(busColorScheme).includes(compare)) 
      {
        shapes += getWave('busL', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);
      }
      shapeStarted = false;
      last = current;
    }

    //for HIGH edge
    else if( current === 'h' || current === 'H')
    {
      points += getWave('h', i * dx , idx * (dy+offsetY), LUT);
      if(Object.keys(busColorScheme).includes(compare)) 
      {
        shapes += getWave('busH', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);
      }
      shapeStarted = false;
      if(current === 'H')extras.push(getArrorw(LUT[5], LUT[0], i * dx, idx * (dy+offsetY), 8, viewMode));
      last = current;
    }

    //For LOW edge
    else if( current === 'l' || current === 'L')
    {
      points += getWave('l', i * dx , idx * (dy+offsetY), LUT);
      if(Object.keys(busColorScheme).includes(compare)) 
      {
        shapes += getWave('busHL', i * dx , idx * (dy+offsetY), LUT);
        busShapes.push(shapes);
      }
      shapeStarted = false;
      //if capital, then add arrow
      if(current === 'L')extras.push(getArrorw(LUT[0], LUT[5], i * dx, idx * (dy+offsetY), 8, viewMode));
      last = current;
    }

    //if current is a bus '='
    else if (Object.keys(busColorScheme).includes(current))
    {
      compare = (prev === '.' || prev === '|') ? last : prev;
      if(compare === '1' || compare === 'n' || compare === 'h' || compare === 'N' || compare === 'H')
      {
        shapes = getWave('1bus', i * dx , idx * (dy+offsetY), LUT);
        points += getWave('L1bus', i * dx , idx * (dy+offsetY), LUT);
      }
      else if(compare === '0' || compare === 'p' || compare === 'l' || compare === 'P' || compare === 'L')
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
      //If it's not a undefined state, try to add text
      if(current !== 'x'){
        //add text
        try{
          var busLen = 0;
          var j = i;
          while(wave[j+1] === '.' || wave[j+1] === '|')
          {
            busLen++;
            j++;
          }
          const t1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          t1.setAttribute("x", i*dx + dx*0.70 + busLen*14);
          t1.setAttribute("y", idx * (dy+offsetY) + 1.20*dy);
          t1.textContent = `${dataIndex < data.split(' ').length ? data.split(' ')[dataIndex] : ' '}`;
          texts.push(t1);
          dataIndex++;
        }
        catch (e)
        {
          console.log(e);
        }
      }
      shapeStarted = true;
      last = '=';
    }
    //if current is continuation of the last bit
    else if (current === '.' || current === '|')
    {
      if(last === '1')
      {
        points += getWave('1', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(last === '0')
      { 
        points += getWave('0', i * dx, idx * (dy+offsetY), LUT);
      }

      //Clock cycles
      else if(last === 'p' || last === 'P')
      {
        points += getWave('p', i * dx, idx * (dy+offsetY), LUT);
        if(last === 'P')extras.push(getArrorw(LUT[5], LUT[0], i * dx, idx * (dy+offsetY), 8, viewMode));
      }
      else if(last === 'n' || last === 'N')
      {
        points += getWave('n', i * dx, idx * (dy+offsetY), LUT);
        if(last === 'N')extras.push(getArrorw(LUT[0], LUT[5], i * dx, idx * (dy+offsetY), 8, viewMode));
      }

      // Steep High low
      else if(last === 'h' || last === 'H')
      {
        points += getWave('1', i * dx, idx * (dy+offsetY), LUT);
      }
      else if(last === 'l' || last === 'L')
      {
        points += getWave('0', i * dx, idx * (dy+offsetY), LUT);
      }

      else if(Object.keys(busColorScheme).includes(last))
      {
        shapes += getWave('bus', i * dx , idx * (dy+offsetY), LUT);
        points += getWave('Lbus', i * dx , idx * (dy+offsetY), LUT);
      }

      //add break symbol
      if(current === '|')
      {
        extras.push(getBreak(LUT[0], LUT[3], i * dx, idx * (dy+offsetY), viewMode))
      }
      
    }
  }
  if(shapeStarted) busShapes.push(shapes);


  text.setAttribute("x", 0);
  text.setAttribute("y", 0);
  text.setAttribute("fill", viewMode ? "black" : "white");
  text.setAttribute("font-family", "monospace");
  text.setAttribute("font-size", "15");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("pointer-events", "none");
  text.setAttribute("class", "dynamic-text");
  texts.forEach(tspan => {
    text.appendChild(tspan);
  });  

  path.setAttribute("d", points);
  path.setAttribute("stroke", lineColor);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", lineWidth);
  path.setAttribute("shapreRendering", "crispEdges");


  //applying shapes
  var colorIdx = 0;
  busShapes.forEach(element => {
    const busShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    busShape.setAttribute("d", element);
    busShape.setAttribute("stroke", "none");
    busShape.setAttribute("stroke-width", 0);
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
  
  //append extras
  extras.forEach(element => {
    ctx.appendChild(element);
  });
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
  else if(segment === 'h')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y}`;
  }
  else if(segment === 'l')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[3].x} ${offsetY+LUT[3].y}`;
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

  // Bus to another bus start and end
  else if(segment === 'bustS')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[1].x} ${offsetY+LUT[1].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[6].x} ${offsetY+LUT[6].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} z`;
  }
  else if(segment === 'bustE')
  {
    return `M${offsetX+LUT[3].x} ${offsetY+LUT[3].y} L${offsetX+LUT[2].x} ${offsetY+LUT[2].y} L${offsetX+LUT[4].x} ${offsetY+LUT[4].y} L${offsetX+LUT[7].x} ${offsetY+LUT[7].y} L${offsetX+LUT[8].x} ${offsetY+LUT[8].y} z`;
  }

  //But to Steep High or low
  else if(segment === 'busH')
  {
    return `M${offsetX+LUT[0].x} ${offsetY+LUT[0].y} L${offsetX+LUT[5].x} ${offsetY+LUT[5].y} z`;
  }
  else if(segment === 'busL')
  {
    return `M${offsetX+LUT[5].x} ${offsetY+LUT[5].y} L${offsetX+LUT[0].x} ${offsetY+LUT[0].y} z`;
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
function GetLUT(dx, dy, div, offsetY, hScale, lineWidth)
{
  var dx1 = (Math.floor(0.5 * dx/div));
  var dx2 = (Math.floor(0.75 * dx/div));
  var dx3 = (dx*hScale - (dx1 + dx2));
  var bo = offsetY + (lineWidth % 2 === 1 ? 0.5 : 0.0);
  var lut = [{x:0, y:bo+dy}, {x:dx1, y:bo+dy}, {x:dx1+dx2, y:bo+dy}, {x:dx1+dx2+dx3, y:bo+dy}, {x:dx1+dx2/2, y:bo+dy/2},
  {x:0, y:bo}, {x:dx1, y:bo}, {x:dx1+dx2, y:bo}, {x:dx1+dx2+dx3, y:bo}];

  return lut;
}

/**
 * Returns the number of time stamps needed to render the signals. 
 * @param {JSON} signals List of flat signals (no grouping)
 * @returns maximum number of timestamp 
 */
export function maxTimeStamp(signals) {
  let maxLen = 0;

  for (let i = 0; i < signals.length; i++) {
    const element = signals[i];

    // Skip empty objects
    if (
      typeof element !== "object" ||
      element === null ||
      Object.keys(element).length === 0 ||
      element.constructor !== Object
    ) {
      continue;
    }

    const scale = Object.keys(element).includes('scale') ? (isNaN(Math.ceil(parseFloat(element.scale))) ? 1 : Math.ceil(parseFloat(element.scale))) : 1;
    const len = !Object.keys(element).includes('space') ? expandWavePattern(element.wave).length * scale : 0;
    maxLen = len > maxLen ? len : maxLen;
  }

  return maxLen;
}

/**
 * expands patterns liike (a, 3) to aaa
 * @param {string} input Input code string from the wave key of the waveform
*/
function expandWavePattern(input) {
  return input.replace(/\(([^,]+),\s*(\d+)\)/g, (_, pattern, count) => {
    return pattern.repeat(parseInt(count));
  });
}

/**
 * Expands pattern of the data key depending on the code pattern.
 * 
 * First letter: u -> up-count, d -> down-count. Second letter: d -> decimal, b -> binary, h -> hexa. So, ux is upcount in hexadecimal.
 * 
 * ud(1, 4) -> 1 2 3 4. ud(1, 4, 2) -> 1 3 5 7 
 * @param {string} input Input code string in the data key of the waveform
 * @returns {string} Expanded version of the short code in the data key
 */
function expandDataPatterns(input) {
  // Match prefix, mode, arguments, suffix
  return input.replace(/(\S*?)(ud|ub|ux|dd|db|dx)\(([^)]*)\)(\S*)/gi,
    (_, prefix, mode, args, suffix) => {
      let [startStr, countStr, stepStr] = args.split(',').map(s => s.trim());
      const s = parseInt(startStr);
      const c = parseInt(countStr);
      const step = stepStr !== undefined ? parseInt(stepStr) : 1;

      const up = mode.startsWith('u');
      const bin = mode.endsWith('b');
      const hex = mode.endsWith('x');

      let result = [];
      for (let i = 0; i < c; i++) {
        let value = up ? s + i * step : s - i * step;

        if (bin) {
          value = value.toString(2);
        } else if (hex) {
          value = value.toString(16).toUpperCase();
        } else {
          value = value.toString();
        }

        result.push(`${prefix}${value}${suffix}`);
      }
      return result.join(' ');
    }
  );
}

//Gets the trinangle arrows for neg or pos edges. 
function getArrorw(p1, p2, offsetX, offsetY, size, viewMode) {
    const xmlns = "http://www.w3.org/2000/svg";

    // Midpoint between p1 and p2
    const dir  = p1.y > p2.y ? 0.86 : -0.86;
    const midX = (p1.x + p2.x) / 2 + offsetX;
    const midY = (p1.y + p2.y) / 2 + offsetY - size * (dir/2);
    

    // Angle from midpoint to p1
    const angleToP1 = Math.atan2(p1.y - midY, p1.x - midX);

    // Equilateral triangle geometry
    const height = (Math.sqrt(3) / 2) * size;

    // Triangle points (pointing towards p1)
    const points = [
        { x: midX + size/2, y: midY }, // Tip
        { x: midX, y: midY + size * dir },
        { x: midX - size / 2, y: midY }
    ];

    // Create polyline element
    const polyline = document.createElementNS(xmlns, "polyline");
    polyline.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
    polyline.setAttribute("fill", viewMode ? "black" : "white"); // change as needed

    return polyline;
}

//Returns the break symbol
function getBreak(p1, p2, offsetX, offsetY, viewMode = 1) {
    const xmlns = "http://www.w3.org/2000/svg";
    // Midpoint
    const midX = (p1.x + p2.x) / 2 + offsetX;
    const midY = (p1.y + p2.y) / 2 + offsetY-10;

    const points =
    [
      //{x : midX - 7, y : midY + 13},
      //{x : midX - 5, y : midY + 15},
      {x : midX - 3, y : midY + 15},
      //{x : midX - 1, y : midY + 12},
          
      //{x : midX, y : midY},
      //{x : midX + 1, y : midY - 12},
      //{x : midX + 3, y : midY - 14},
      {x : midX + 1, y : midY - 15},
      //{x : midX + 7, y : midY - 13},
    ];

    const points2= [...points].reverse().map(p => ({ x: p.x + 5, y: p.y - 1}));
    // [
    //   {x : midX + 8, y : midY - 13},
    //   {x : midX + 6, y : midY - 15},
    //   {x : midX + 4, y : midY - 14},
    //   {x : midX + 2, y : midY - 12},
          
    //   {x : midX, y : midY},

    //   {x : midX - 2, y : midY + 12},
    //   {x : midX - 4, y : midY + 14},
    //   {x : midX - 6, y : midY + 15},
    //   {x : midX - 8, y : midY + 13},
    // ].map(p => ({ x: p.x + 5, y: p.y }));

    const polyline = document.createElementNS(xmlns, "polyline");
    polyline.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" "));
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", viewMode ? "black" : "white");

    const polyline2 = document.createElementNS(xmlns, "polyline");
    polyline2.setAttribute("points", points2.map(p => `${p.x},${p.y}`).join(" "));
    polyline2.setAttribute("fill", "none");
    polyline2.setAttribute("stroke", viewMode ? "black" : "white");

    const polygon = document.createElementNS(xmlns, "polygon");
    polygon.setAttribute("points", points.concat(points2).map(p => `${p.x},${p.y}`).join(" "));
    polygon.setAttribute("fill", viewMode ? "white" : "black");
    polygon.setAttribute("stroke", "none");
    //polyline.setAttribute("transform", `rotate(1 5, ${midX}, ${midY})`);

    // Create SVG group
    const group = document.createElementNS(xmlns, "g");
    group.setAttribute("transform", `rotate(15, ${midX}, ${midY})`);
    // Append elements to group (polygon first, then polylines)
    group.appendChild(polygon);
    group.appendChild(polyline);
    group.appendChild(polyline2);
    return group;
    
}

//Pattern generator function for 'X'
function getDiagonalHatchPattern({
  id = "hatch-diag",
  size = 5,
  stroke = "#000",
  strokeWidth = 2,
  rotation = 45,
} = {}) {
  const svgns = "http://www.w3.org/2000/svg";

  // Create pattern element
  const pattern = document.createElementNS(svgns, "pattern");
  pattern.setAttribute("id", id);
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", size);
  pattern.setAttribute("height", size);
  pattern.setAttribute("patternTransform", `rotate(${rotation})`);

  // Create hatch line
  const path = document.createElementNS(svgns, "path");
  path.setAttribute("d", `M 0 0 L 0 ${size}`);
  path.setAttribute("stroke", stroke);
  path.setAttribute("stroke-width", strokeWidth);

  pattern.appendChild(path);
  return pattern;
}

function darkenHexColor(hex, percent) {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');

    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Calculate darkening amount
    const amount = Math.round(2.55 * percent); // percentage of 255

    // Darken RGB values, ensuring they don't go below 0
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    // Convert RGB back to hex
    const newHex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

    return `#${newHex}`;
}
