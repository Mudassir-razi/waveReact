import React, { useMemo } from "react";
import { useAppConfig } from "./config";
import { buildCurvePath } from "./curvedAnnotation";

const cursorColor = "#d4d4d4";

export function Grid({ maxWaveLength, signalCount }) {
  const config = useAppConfig().config;
  const pathD = useMemo(() => {
    const totalHeight = (signalCount + 1) * (config.dy + config.offsetY);
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
  const labelInterval = Math.max(1, Math.round(config.rulerLabelInterval ?? 1));

  // The band is read bottom-up: ticks at the baseline, then a gap, then the
  // numbers. Keeping the ticks short leaves the numbers clear of the top edge,
  // which matters once the file is exported and rendered with whatever
  // monospace font the viewer resolves "courier" to.
  const majorTick = 6;
  const minorTick = 3;
  const labelBaseline = rulerHeight - majorTick - 2;

  const ticks = [];
  const texts = [];

  for (let i = 0; i <= maxWaveLength; i++) {
    const x = i * config.dx + 0.5;
    const labelled = i % labelInterval === 0;

    ticks.push(
      <line
        key={"tick-" + i}
        x1={x}
        // Cycles that carry no number get a shorter tick, so the ones that do
        // stand out and the unnumbered cycles stay countable.
        y1={rulerHeight - (labelled ? majorTick : minorTick)}
        x2={x}
        y2={rulerHeight}
        stroke="#747474"
        strokeWidth={1}
        shapeRendering="crispEdges"
      />
    );

    if (!labelled) continue;

    texts.push(
      <text
        key={"text-" + i}
        x={x}
        y={labelBaseline}
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

export const Cursor = React.memo(function Cursor({
  mouseX,
  mouseY,
  start,
  end,
  foot,
  height,
  mode,
  state,
  annotationMode,
  curveP1,
  curveP2,
}) {
  const config = useAppConfig().config;
  const darkMode = config.darkMode ?? true;
  const annoStroke = darkMode ? "#6b9fd4" : "#2563eb";

  if (mouseX == null) return null;

  if (mode === "annotation" && annotationMode === "curve") {
    return (
      <g id="cursor-preview">
        <Pointer mouseX={mouseX} height={height} />
        {curveP1 && state === 1 && (
          <>
            <circle cx={curveP1.x} cy={curveP1.y} r={3} fill={annoStroke} />
            <line
              x1={curveP1.x}
              y1={curveP1.y}
              x2={mouseX}
              y2={mouseY}
              stroke={annoStroke}
              strokeWidth={1}
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          </>
        )}
        {curveP1 && curveP2 && state === 2 && (
          <>
            <circle cx={curveP1.x} cy={curveP1.y} r={3} fill={annoStroke} />
            <circle cx={curveP2.x} cy={curveP2.y} r={3} fill={annoStroke} />
            <path
              d={buildCurvePath(
                curveP1.x,
                curveP1.y,
                curveP2.x,
                curveP2.y,
                mouseX,
                mouseY
              )}
              fill="none"
              stroke={annoStroke}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
            <circle cx={mouseX} cy={mouseY} r={4} fill={annoStroke} />
          </>
        )}
      </g>
    );
  }

  if (mode === "annotation") {
    return (
      <g id="cursor-preview">
        <TempAnno
          mouseX={mouseX}
          mouseY={mouseY}
          start={start * config.dx}
          end={end * config.dx}
          foot={foot}
          height={height}
          state={state}
          strokeColor={annoStroke}
        />
      </g>
    );
  }

  return (
    <g id="cursor-preview">
      <Pointer mouseX={mouseX} height={height} />
    </g>
  );
});

const TempAnno = ({
  mouseX,
  mouseY,
  start,
  end,
  foot,
  height,
  state,
  strokeColor = "#6b9fd4",
}) => {
  if (state === 0) return <Pointer mouseX={mouseX} height={height} />;
  if (state === 1) {
    return (
      <g>
        <Pointer mouseX={mouseX} height={height} />
        <line
          x1={start}
          y1={foot}
          x2={start}
          y2={mouseY}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <line
          x1={start}
          y1={mouseY}
          x2={mouseX}
          y2={mouseY}
          stroke={strokeColor}
          strokeWidth={1}
        />
      </g>
    );
  }
  if (state === 2) {
    return (
      <g>
        <Pointer mouseX={mouseX} height={height} />
        <line
          x1={start}
          y1={mouseY}
          x2={start}
          y2={foot}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <line
          x1={end}
          y1={mouseY}
          x2={end}
          y2={foot}
          stroke={strokeColor}
          strokeWidth={1}
        />
        <line
          x1={end}
          y1={mouseY}
          x2={start}
          y2={mouseY}
          stroke={strokeColor}
          strokeWidth={1}
        />
      </g>
    );
  }
  return null;
};

const Pointer = ({ mouseX, height }) => (
  <line
    x1={mouseX}
    y1={0}
    x2={mouseX}
    y2={height}
    stroke={cursorColor}
    strokeWidth={1}
  />
);
