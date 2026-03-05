import React, { useMemo } from "react";
import { useAppConfig } from "../core/config";


const cursorColor = "#d4d4d4";

export function Grid({
  maxWaveLength,
  signalCount
}) {

  //console.log("Making grid");
  const config = useAppConfig().config;
  const pathD = useMemo(() => {
    const totalHeight =
      (signalCount + 1) * (config.dy + config.offsetY);

    const y1 = 15;
    const y2 = totalHeight - 15;

    let d = "";

    for (let i = 0; i <= maxWaveLength; i++) {
      const x = i * config.dx + 0.5;

      d += `M ${x} ${y1} V ${y2} `;
    }

    return d;
  }, [config, maxWaveLength, signalCount]);

  return (
    <path
      d={pathD}
      stroke={config.darkMode ? "lightGrey" : "#535353"}
      strokeOpacity={0.4}
      strokeWidth={1}
      strokeDasharray="4 4"
      fill="none"
      pointerEvents="none"
    />
  );
}


export const TimeRuler = React.forwardRef(function TimeRuler(
    { maxWaveLength },
    ref
  ) {
    const config = useAppConfig().config;
    const rulerHeight = config.rulerHeight ?? 20;
    const svgWidth = maxWaveLength * config.dx + 1;

    const ticks = [];
    const texts = [];

    for (let i = 0; i <= maxWaveLength; i++) {
      const x = i * config.dx + 0.5;

      ticks.push(
        <line
          key={"tick-" + i}
          x1={x}
          y1={rulerHeight - 8}
          x2={x}
          y2={rulerHeight}
          stroke="#747474"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
      );

      texts.push(
        <text
          key={"text-" + i}
          x={x}
          y={rulerHeight - 10}
          textAnchor="middle"
          fontSize="10"
          fontFamily="courier"
          fill="#808080"
          style={{ userSelect: "none" }}
        >
          {i}
        </text>
      );
    }

    return (
      <svg
        ref={ref}
        width={svgWidth}      
        height={rulerHeight}
        viewBox={`0 0 ${svgWidth} ${rulerHeight}`}
        style={{ display: "block", overflow: "hidden" }}
      >
        <g>
          {ticks}
          {texts}
        </g>
      </svg>
    );
  });



export const Cursor = React.memo(function Cursor({mouseX, mouseY, start, end, foot, height, mode, state}) {
  const config = useAppConfig().config;
  if (mouseX == null) return null;
  if(mode === "annotation")return (
    <TempAnno 
      mouseX={mouseX} 
      mouseY={mouseY} 
      start={start * config.dx} 
      end={end* config.dx} 
      foot={foot} 
      height={height} 
      state={state}
    />
  );
  else return (
      <Pointer mouseX={mouseX} height={height}/>
  );
});


const TempAnno = ({mouseX, mouseY, start, end, foot, height, state}) => 
{
    //console.log(start, foot);
    if(state === 0)return <Pointer mouseX={mouseX} height={height}/>;
    else if(state === 1)
    {
      return(
        <g>
          <Pointer mouseX={mouseX} height={height}/>
          <line
            x1={start}
            y1={foot}
            x2={start}
            y2={mouseY}
            stroke="#c4c4c4"
            strokeWidth={1}
          />
          <line
            x1={start}
            y1={mouseY}
            x2={mouseX}
            y2={mouseY}
            stroke={cursorColor}
            strokeWidth={1}
          />
        </g>
      );
    }
    else if(state === 2)
    {
      return(
      <g>
          <Pointer mouseX={mouseX} height={height}/>
          <line
            x1={start}
            y1={mouseY}
            x2={start}
            y2={foot}
            stroke={cursorColor}
            strokeWidth={1}
          />
          <line
            x1={end}
            y1={mouseY}
            x2={end}
            y2={foot}
            stroke={cursorColor}
            strokeWidth={1}
          />
          <line
            x1={end}
            y1={mouseY}
            x2={start}
            y2={mouseY}
            stroke={cursorColor}
            strokeWidth={1}
          />
        </g>);
    }
   else return null;
}

const Pointer = ({mouseX, height}) => 
{
  return(
        <g>
          <line
            x1={mouseX}
            y1={0}
            x2={mouseX}
            y2={height}
            stroke={cursorColor}
            strokeWidth={1}
          />
        </g>
      );
}
