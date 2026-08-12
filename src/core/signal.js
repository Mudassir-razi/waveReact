import { getShapeSegment, getLineSegment, getShapeSegmentForce, initRender } from "./segmentRenderer";
import { getTextSegment, initTextRenderer, getTextSegmentForce } from "./segmentTextRenderer";
import { forwardRef, useState } from "react";
import React, { useMemo } from "react";
import {Grid, Cursor} from "./grid";
import TimingAnnotations from "./annotation";
import CurvedAnnotations from "./curvedAnnotation";
import BreakNotations, { BreakMaskLayer } from "./breakNotation";
import { useAppConfig, isDarkMode } from "../core/config";
import { getCanvasFill } from "./waveGeometry";


const div = 4;
//coordinate lookup table

const patternId = "my-hatch-pattern";
const busColorScheme = {

  // Hex only: darkenHexColor cannot read CSS colour names.
  '=' : '#ffffff',
  'a' : '#808080',
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
const SignalWindow = forwardRef(({
  pos,
  signals,
  anno,
  maxWaveLength,
  height,
  width,
  mouseDownSVG,
  mouseUpSVG,
  mode,
  state,
  start,
  end,
  foot,
  annotationMode,
  curveP1,
  curveP2,
  breakMode,
  onAnnotationUpdate,
  onAnnotationDelete,
  onBreakUpdate,
  onBreakDelete,
}, ref) => 
{
  const { config } = useAppConfig();
  const darkMode = isDarkMode(config);
  const canvasFill = getCanvasFill(darkMode);

  const [mouseX, setMouseX] = useState(null);
  const [mouseY, setMouseY] = useState(null);

  //console.log("singlan window");
  // Track mouse movement inside SVG
  const handleMouseMove = (event) => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const cursorPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    setMouseX(cursorPoint.x); // update cursor x
    setMouseY(cursorPoint.y);
  };

  const linearAnnotations = useMemo(
    () =>
      (anno || [])
        .map((item, sourceIndex) => ({ ...item, sourceIndex }))
        .filter(
          (item) =>
            item.type !== "curved" &&
            typeof item.start === "number" &&
            typeof item.end === "number" &&
            typeof item.head === "number" &&
            typeof item.foot === "number"
        ),
    [anno]
  );

  const curvedAnnotations = useMemo(
    () =>
      (anno || [])
        .map((item, sourceIndex) => ({ ...item, sourceIndex }))
        .filter(
          (item) =>
            item.type === "curved" &&
            typeof item.x1 === "number" &&
            typeof item.y1 === "number" &&
            typeof item.x2 === "number" &&
            typeof item.y2 === "number"
        ),
    [anno]
  );

  const breakItems = useMemo(
    () =>
      (anno || [])
        .map((item, sourceIndex) => ({ ...item, sourceIndex }))
        .filter(
          (item) =>
            typeof item.signalIndex === "number" &&
            typeof item.timeStamp === "number" &&
            typeof item.global === "boolean"
        ),
    [anno]
  );

  return(
    <svg 
      ref={ref} 
      id="mainLayer" 
      x={pos.x}
      y={pos.y}
      width={width} 
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", backgroundColor: canvasFill }}
      onMouseMove={handleMouseMove}
      onMouseDown={mouseDownSVG}
      onMouseUp={mouseUpSVG}
    >
    <DiagonalHatchPattern/>
    <Grid
      maxWaveLength={maxWaveLength}
      signalCount={signals.length}
    />
    <Cursor 
      mouseX={mouseX}
      mouseY={mouseY} 
      height={height} 
      mode={mode}
      state={state}
      start={start}
      end={end}
      foot={foot}
      annotationMode={annotationMode}
      curveP1={curveP1}
      curveP2={curveP2}
    />
    <AllSignals
      signals={signals}
      viewMode={darkMode}
    />
    <BreakMaskLayer
      breaks={breakItems}
      signalCount={signals.length}
      fill={canvasFill}
    />
    <TimingAnnotations
      annotations={linearAnnotations}
      mode={mode === "annotation" && annotationMode === "edit"}
      onUpdate={onAnnotationUpdate}
    />
    <CurvedAnnotations
      annotations={curvedAnnotations}
      mode={mode === "annotation" && annotationMode === "edit"}
      onUpdate={onAnnotationUpdate}
      onDelete={onAnnotationDelete}
    />
    <BreakNotations
      breaks={breakItems}
      signalCount={signals.length}
      darkMode={darkMode}
      mode={mode === "break" && breakMode === "edit"}
      onUpdate={onBreakUpdate}
      onDelete={onBreakDelete}
    />
    </svg>

  );
});

export default SignalWindow;

function AllSignals({
  signals,
  viewMode,
}) {

    const config = useAppConfig().config;
    return signals
      .map((signal, i) => {
        if (
          typeof signal === "object" &&
          Object.keys(signal).length === 0
        ) {
          return null;
        }
        
        // A trace is a thin stroke, so it takes the colour at full strength
        // rather than the washed out fill that bus bodies use.
        const color =
          Object.keys(signal).includes("color") &&
          Object.keys(busColorScheme).includes(signal.color)
            ? busColorScheme[signal.color]
            : viewMode
            ? "white"
            : "black";

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
          />
        );
      })
      .filter(Boolean);
    }

function Signal({
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
}) {

  const {
    points,
    busShapes,
    busColors,
    texts
  } = useMemo(() => {
    //console.log("Using memo");
    const parsedInt = parseFloat(Rawscale);
    const scale = isNaN(parsedInt) ? 1 : parsedInt;
    const waveY = idx * (dy + offsetY) + 15;

    let points = ["", ""];
    let texts = [];
    let busShapes = [];
    let busColors = [];

    let current = wave[0];
    let lastValid = current === "0" ? "1" : "0";
    let complement = false;

    initRender(UnscaledDx, dy, div, waveY, scale, lineWidth % 2 !== 0);
    initTextRenderer(UnscaledDx, dy, waveY, scale, data);
    //console.log(wave.length, texts.length, texts);
    for (let i = 0; i < wave.length; i++) {
      try{
        current = wave[i];
        //console.log(i, current);
        //deal with complementary signal
        if(current === ' ' && wave[i+1] === '~' && complement === false)
        {
          //we are at the end of true signal. not tie up the loose ends. 
          complement = true; i = -1;
          const lastSegment = getShapeSegmentForce();
          const lastTextSegment = getTextSegmentForce();

          if (lastSegment) {
            busShapes.push(lastSegment);
            busColors.push(busColorScheme[lastValid]);
          }

          if (lastTextSegment) {
            //console.log( typeof(lastTextSegment));
            if (Array.isArray(lastTextSegment)) {
              texts.push(...lastTextSegment);
            } else {
              texts.push(lastTextSegment);
            }
          } 
          continue;
        }

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

        const currentValidStateForText = current === "x" ? "X" : currentValidState;

        //We do the normal thing if we are True signal
        if(complement === false){
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
            currentValidStateForText,
            lastValidState,
            i * dxScaled + phase
          );

          if (shape) {
            busColors.push(busColorScheme[lastValid]);
            busShapes.push(shape);
          }

          if (textSegment) {
            //console.log(textSegment, i);
            if (Array.isArray(textSegment)) {
              texts.push(...textSegment);
            } else {
              texts.push(textSegment);
            }
          }
        }
        
        //We're doing complementary signal, only lines. 
        else{
          points[1] += getLineSegment(
            currentValidState,
            lastValidState,
            i * dxScaled + phase
          );
        }

          lastValid = current === "." ? lastValid : current;
        }catch(err)
        {
          lastValid = current === "." ? lastValid : current;
          continue;
        }
      }

    // A bus is only emitted once the state that follows it closes the shape,
    // so a wave that ends on a bus leaves the last one unfilled and unlabelled
    // unless it is flushed here.
    const trailingShape = getShapeSegmentForce();
    if (trailingShape) {
      busShapes.push(trailingShape);
      busColors.push(busColorScheme[lastValid]);
    }

    const trailingText = getTextSegmentForce();
    if (trailingText) {
      if (Array.isArray(trailingText)) texts.push(...trailingText);
      else texts.push(trailingText);
    }

    return { points, busShapes, busColors, texts };

  }, [
    wave,
    data,
    idx,
    UnscaledDx,
    dy,
    offsetY,
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
          fill={darkenHexColor(busColors[i], 20)}
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
        {/* Here */}
        {texts}
      </text>
    </>
  );
}



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

    try{
      if(typeof hex !== "string") return undefined;
      if(hex.startsWith("url(")) return hex; //pattern fill, do not darken

      let digits = hex.replace(/^#/, '');
      if(digits.length === 3) digits = digits.replace(/./g, (c) => c + c);
      // A colour we cannot read as hex would darken to a stray black, so hand
      // it back untouched instead.
      if(!/^[0-9a-f]{6}$/i.test(digits)) return hex;

      // Convert hex to RGB
      let r = parseInt(digits.substring(0, 2), 16);
      let g = parseInt(digits.substring(2, 4), 16);
      let b = parseInt(digits.substring(4, 6), 16);

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
      return hex;
    }
}
