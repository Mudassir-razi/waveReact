import { getShapeSegment, getLineSegment, getShapeSegmentForce, initRender } from "./segmentRenderer";
import { getTextSegment, initTextRenderer, getTextSegmentForce } from "./segmentTextRenderer";
import { forwardRef, useEffect, useRef, useState } from "react";
import React, { useMemo } from "react";
import {Grid, Cursor} from "./grid";

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

export function getBuses()
{
  return busColorScheme;
}

//returns the main layer of the canvas, with all the signals rendered onto it
const SignalWindow = forwardRef(({pos, signals, config, maxWaveLength, height, width, viewMode, mouseDownSVG, mouseUpSVG}, ref) => 
{
  const [mouseX, setMouseX] = useState(null);

  // Track mouse movement inside SVG
  const handleMouseMove = (event) => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const cursorPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    setMouseX(cursorPoint.x); // update cursor x
  };

  // Handle clicks (example: log or select)
  const handleClick = (event) => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const clickPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    //console.log("Clicked at", clickPoint.x, clickPoint.y);
    mouseDownSVG({ x: clickPoint.x, y: clickPoint.y }); 
    // you can update other states here if needed
  };

  const handleClickUp = (event) => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const clickPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    //console.log("Clicked up at", clickPoint.x, clickPoint.y);
    mouseUpSVG({ x: clickPoint.x, y: clickPoint.y }); 
    // you can update other states here if needed
  };

  return(
    <svg 
    ref={ref} 
    id="mainLayer" 
    x={pos.x}
    y={pos.y}
    width={width} 
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={{ display: "block", backgroundColor: "#00000000" }}
    onMouseMove={handleMouseMove}
    onMouseDown={handleClick}
    onMouseUp={handleClickUp}
  >
    <DiagonalHatchPattern/>
    <Grid
      config={config}
      maxWaveLength={maxWaveLength}
      signalCount={signals.length}
    />
    <Cursor mouseX={mouseX} height={height} />
    <AllSignals
      signals={signals}
      config={config}
      maxWaveLength={maxWaveLength}
      viewMode={viewMode}
    />
    </svg>

  );
});

export default SignalWindow;

const AllSignals = React.memo(function AllSignals({
  signals,
  config,
  maxWaveLength,
  viewMode,
}) {

  const renderedSignals = useMemo(() => {
    return signals
      .map((signal, i) => {
        if (
          typeof signal === "object" &&
          Object.keys(signal).length === 0
        ) {
          return null;
        }

        const color =
          Object.keys(signal).includes("color") &&
          Object.keys(busColorScheme).includes(signal.color)
            ? darkenHexColor(busColorScheme[signal.color], 20)
            : viewMode
            ? "black"
            : "white";

        return (
          <Signal
            key={i}
            wave={signal.wave}
            data={signal.data}
            idx={i}
            UnscaledDx={config.dx}
            dy={config.dy}
            offsetY={config.offsetY}
            lineWidth={signal.width}
            Rawscale={signal.scale}
            phase={signal.phase * 3}
            lineColor={color}
            viewMode={viewMode}
          />
        );
      })
      .filter(Boolean);
  }, [signals, config, viewMode]);

  return <>{renderedSignals}</>;
});


const Signal = React.memo(function Signal({
  wave,
  data,
  idx,
  UnscaledDx,
  dy,
  offsetY,
  lineWidth = 1,
  Rawscale = 1,
  phase,
  lineColor,
  viewMode
}) {

  const {
    points,
    busShapes,
    busColors,
    texts
  } = useMemo(() => {

    const parsedInt = parseFloat(Rawscale);
    const scale = isNaN(parsedInt) ? 1 : parsedInt;
    const waveY = idx * (dy + 10) + 15;

    let points = ["", ""];
    let texts = [];
    let busShapes = [];
    let busColors = [];

    let current = wave[0];
    let lastValid = current === "0" ? "1" : "0";
    let complement = false;

    initRender(UnscaledDx, dy, div, waveY, scale, lineWidth % 2 !== 0);
    initTextRenderer(UnscaledDx, dy, waveY, scale, data);

    for (let i = 0; i < wave.length; i++) {
      current = wave[i];

      //deal with complementary signal
      if(current === ' ' && wave[i+1] === '~' && complement === false){complement = true; i = -1; continue;}
      if(complement) current = getComplement(current);
      
      const dxScaled = UnscaledDx * scale;

      const lastValidState =
        Object.keys(busColorScheme).includes(lastValid)
          ? "B"
          : lastValid.toUpperCase();

      const currentValidState =
        Object.keys(busColorScheme).includes(current)
          ? "B"
          : current.toUpperCase();

      //We do the normal thing if we are True signal
      if(!complement){
        points[0] += getLineSegment(
          currentValidState,
          lastValidState,
          i * dxScaled + phase
        );

        const shape = getShapeSegment(
          currentValidState,
          lastValidState,
          i * dxScaled + phase
        );

        const textSegment = getTextSegment(
          currentValidState,
          lastValidState,
          i * dxScaled + phase
        );

        if (shape) {
          busColors.push(busColorScheme[lastValid]);
          busShapes.push(shape);
        }

        if (textSegment) {
          if (Array.isArray(textSegment)) {
            texts.push(...textSegment);
          } else {
            texts.push(textSegment);
          }
        }

        lastValid = current === "." ? lastValid : current;

        const lastSegment = getShapeSegmentForce();
        const lastTextSegment = getTextSegmentForce();

        if (lastSegment) {
          busShapes.push(lastSegment);
          busColors.push(busColorScheme[lastValid]);
        }

        if (lastTextSegment) {
          if (Array.isArray(lastTextSegment)) {
            texts.push(...lastTextSegment);
          } else {
            texts.push(lastTextSegment);
          }
        }
      }
      else{
        points[1] += getLineSegment(
          currentValidState,
          lastValidState,
          i * dxScaled + phase
        );
        lastValid = current === "." ? lastValid : current;
      }
    }
    return { points, busShapes, busColors, texts };

  }, [
    wave,
    data,
    idx,
    UnscaledDx,
    dy,
    Rawscale,
    phase,
    lineWidth
  ]);

  return (
    <>
      {/* Bus Shapes */}
      {busShapes.map((shape, i) => (
        <path
          key={`bus-${i}`}
          d={shape}
          stroke="none"
          strokeWidth={0}
          fill={
            busColors[i][0] !== "u"
              ? darkenHexColor(busColors[i], 20)
              : busColors[i]
          }
          fillOpacity="1"
        />
      ))}

      {/* Main Signal Path */}
      <path
        d={points[0]}
        stroke={lineColor}
        fill="none"
        strokeWidth={lineWidth}
      />

      {/* Complementary signal path */}
      <path
        d={points[1]}
        stroke={lineColor}
        fill="none"
        strokeDasharray="4 4"
        strokeWidth={lineWidth}
      />

      {/* Text */}
      <text
        x={0}
        y={0}
        fill="white"
        fontFamily="monospace"
        textAnchor="middle"
        pointerEvents="none"
        className="dynamic-text"
      >
        {texts.map((tspan, i) => (
          <tspan key={i} {...tspan} />
        ))}
      </text>
    </>
  );
});



//Pattern generator function for 'X'
function DiagonalHatchPattern({
  id = patternId,
  size = 5,
  stroke = "#ffffff",
  strokeWidth = 1,
  rotation = 45,
}) {
  return (
    <defs>
      <pattern
        id={id}
        patternUnits="userSpaceOnUse"
        width={size}
        height={size}
        patternTransform={`rotate(${rotation})`}
      >
        <path
          d={`M 0 0 L 0 ${size}`}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </pattern>
    </defs>
  );
}

function getComplement(bit)
{
  var comp = '-';
  switch(bit)
  {
    case '1': {comp = '0';break;}
    case '0': {comp = '1';break;}
    case 'p': {comp = 'n';break;}
    case 'n': {comp = 'p';break;}
    case 'h': {comp = 'l';break;}
    case 'l': {comp = 'h';break;}
    case 'P': {comp = 'N';break;}
    case 'N': {comp = 'P';break;}
    case 'H': {comp = 'L';break;}
    case 'L': {comp = 'H';break;}
    default : {comp = bit;break;}
  }
  return comp;
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
