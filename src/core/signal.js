import { getShapeSegment, getLineSegment, getShapeSegmentForce, initRender } from "./segmentRenderer";
import { getTextSegment, initTextRenderer, getTextSegmentForce } from "./segmentTextRenderer";
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
  'r' : '#f0a0b8',
  'v' : '#f0c9f2',
  'm' : '#edeca6',
  'x' : `url(#${patternId})`
};

//returns the main layer of the canvas, with all the signals rendered onto it
export default function SignalWindow({pos, signals, config, height, width, vpHeight, vpWidth, viewMode})
{
  const signalWindowRef = useRef(null);
  //console.log(signals);
  //Renders the signals on the canvas  
  useEffect(()=>{
    const mainCanvas = signalWindowRef.current;
    renderAllSignals(mainCanvas, signals, config, viewMode);
  }, [signals, config, viewMode]);


  return(
      <svg 
      ref={signalWindowRef} 
      id="mainLayer" 
      x={pos.x}
      y={pos.y}
      width={width} 
      height={height} 
      viewBox={`0 0 ${vpWidth} ${vpHeight}`}
      // style={{ position: "absolute", top: 10, left: offsetX, zIndex: 2, backgroundColor: "white" }}
      // onMouseDown={(e) => {
      //   const rect = e.currentTarget.getBoundingClientRect();
      //   const x = Math.floor((e.clientX - rect.left));
      //   const y = Math.floor((e.clientY - rect.top) );
      //   onDown({ x, y }); 
      // }}
      // onMouseMove={(e) => {
      //   const rect = e.currentTarget.getBoundingClientRect();
      //   const x = Math.floor((e.clientX - rect.left));
      //   const y = Math.floor((e.clientY - rect.top));
      //   console.log("Move");
      //   onMove({ x, y });
      // }}
      // onMouseUp={(e) => {
      //   const rect = e.currentTarget.getBoundingClientRect();
      //   const x = Math.floor((e.clientX - rect.left) / dx);
      //   const y = Math.floor((e.clientY - rect.top) / (dy+offsetY));
      //   onUp({ x, y });
      // }}
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
function renderAllSignals(svg_canvas, signals, config, viewMode)
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
      const pattern = getDiagonalHatchPattern({ id: patternId, stroke : "white" });
      defs.appendChild(pattern);
    }

    var i = 0;
    for(i = 0; i < signals.length; i++){
        if(typeof signals[i] === "object" &&
            Object.keys(signals[i]).length === 0 ) continue;
        const signal = signals[i];
        var color = Object.keys(signals[i]).includes("color") && Object.keys(busColorScheme).includes(signal.color)? darkenHexColor(busColorScheme[signal.color],20) : (viewMode ? "black" : "white");
        
        renderSignal(svg_canvas, 
          signal.wave, 
          signal.data, 
          i,
          config.dx, 
          config.dy, 
          config.offsetY, 
          signal.width, 
          signal.scale, 
          signal.phase * 3, 
          color, 
          viewMode);
      }
}

function renderSignal(ctx, wave, data, idx, UnscaledDx, dy, offsetY, lineWidth=1, Rawscale=1, phase, lineColor, viewMode)
{

  const parsedInt = parseFloat(Rawscale);
  const scale = isNaN(parsedInt) ? 1 : parsedInt;

  //For signal lines
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  //For signal shapes (buses)
  const busShapes = [] ;
  const busColors = [] ;
  //For in-signal texts
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  //Extra direct SVG stuff (rect, poly etc)
  const extras = [];
  const waveY = idx * (dy + 10) + 15;

  var points = '';
  var texts =  [];
  var current = wave[0];
  var lastValid = current === '0' ? '1' : '0';

  //console.log(dy, waveY, idx);
  initRender(UnscaledDx, dy, div, waveY, scale, lineWidth % 2 !== 0);
  initTextRenderer(UnscaledDx, dy, waveY, scale, data);
  for(var i = 0;i < wave.length; i++)
  { 
    current = wave[i];
    const dxScaled = UnscaledDx * scale;
    const lastValidState = Object.keys(busColorScheme).includes(lastValid) ? "B" : lastValid.toUpperCase();
    const currentValidState = Object.keys(busColorScheme).includes(current) ? "B" : current.toUpperCase();
    points += getLineSegment(currentValidState, lastValidState, i * dxScaled + phase);
    const shape = getShapeSegment(currentValidState, lastValidState, i * dxScaled + phase);
    const textSegment = getTextSegment(currentValidState, lastValidState, i * dxScaled + phase);

    if(shape)
    {
      busColors.push(busColorScheme[lastValid]);
      busShapes.push(shape);
    }
    if(textSegment) 
    {
      if(Array.isArray(textSegment))texts.push(...textSegment);
      else texts.push(textSegment);
    }
    //console.log(textSegment);
    lastValid = current === '.' ? lastValid : current;
  }

  //handle last shape if needed
  const lastSegment = getShapeSegmentForce();
  const lastTextSegment = getTextSegmentForce();
  if(lastSegment){
    busShapes.push(lastSegment);
    busColors.push(busColorScheme[lastValid]);
  }
  if(lastTextSegment)
  {
    if(Array.isArray(lastTextSegment))texts.push(...lastTextSegment);
    else texts.push(lastTextSegment);
  }

  try{
    //console.log(busShapes, lastValid);
    text.setAttribute("x", 0);
    text.setAttribute("y", 0);
    text.setAttribute("fill", "white");
    text.setAttribute("font-family", "monospace");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("pointer-events", "none");
    text.setAttribute("class", "dynamic-text");
    texts.forEach(tspan => {
      text.appendChild(tspan);
    }); 
  } catch (error) {
    console.log(error);
    console.log(texts);
  } 

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
    busShape.setAttribute("fill", busColors[colorIdx] !== 'x' ? darkenHexColor(busColors[colorIdx], 20) : busColors[colorIdx]);
    busShape.setAttribute("fill-opacity", "1");
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



//Pattern generator function for 'X'
function getDiagonalHatchPattern({
  id = "hatch-diag",
  size = 5,
  stroke = "#000",
  strokeWidth = 1,
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
    try{
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

      //50 for opacity
      return `#${newHex}50`;
    }catch{
      return "white";
    }
}
