import React, { useMemo } from "react";

export const Grid = React.memo(function Grid({
  config,
  maxWaveLength,
  signalCount
}) {

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
      stroke="lightgrey"
      strokeOpacity={0.4}
      strokeWidth={1}
      strokeDasharray="4 4"
      fill="none"
      pointerEvents="none"
    />
  );
});


export const TimeRuler = React.memo(
  React.forwardRef(function TimeRuler(
    { config, maxWaveLength },
    ref
  ) {

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
  })
);



export const Cursor = React.memo(function Cursor({ mouseX, height }) {
  if (mouseX == null) return null;

  return (
    <g pointerEvents="none">
      <line
        x1={mouseX}
        y1={0}
        x2={mouseX}
        y2={height}
        stroke="#555555"
        strokeWidth={1}
      />
      <line
        x1={mouseX + 15}
        y1={0}
        x2={mouseX + 15}
        y2={height}
        stroke="#555555"
        strokeWidth={1}
      />
    </g>
  );
});
