import { useEffect, useRef } from "react";

export default function Grid({
  dx,
  dy,
  mouse,
  prevMouse,
  dragging,
  offsetX,
  offsetY,
  timeStamp,
  signalCount,
  viewMode,
  annotationMode,
  cursorState,
  currentCoord,
  annotations = []   // <--- NEW
}) {
  const BGcanvasRef = useRef(null);

  useEffect(() => {
    const svg_bg_canvas = BGcanvasRef.current;
  }, [dx, dy, mouse, prevMouse, dragging, offsetX, offsetY, timeStamp, signalCount, annotations]);

  // --- GRID LINES ---
  const gridLines = Array.from({ length: timeStamp + 1 }, (_, i) => {
    const x = i * dx;
    return (
      <line
        key={"grid" + i}
        x1={x + 0.5}
        y1={15}
        x2={x + 0.5}
        y2={signalCount * (dy + offsetY) + 0.5}
        stroke={viewMode ? "grey" : "lightgrey"}
        strokeOpacity={0.4}
        strokeWidth={1}
        strokeDasharray="4 4"
        pointerEvents="none"
      />
    );
  });

  // Time labels
  const timeLabels = Array.from({ length: timeStamp + 1 }, (_, i) => {
    const x = i * dx;
    return (
      <text
        key={"time" + i}
        x={i === 0 ? x - 1 : Math.round(x-(i >= 10 ? 5 : 3))}               // slight horizontal offset
        y={10.5}                  // position above the grid
        fill={viewMode ? "#0000006c" : "#ffffff71"}
        fontSize="10"
        textAnchor="start"
        fontFamily="courier"
        pointerEvents="none"
        textRendering="geometricPrecision"
        shapeRendering="crispEdges"
      >
        {i}
      </text>
    );
  });

  // Cursor state
  const CurrentCursor = () => {
    if(annotationMode === 0)return null;
    if (!currentCoord || !mouse || mouse.length < 2) return null;

    const x1 = currentCoord.startX + currentCoord.startOffset + 0.5;
    const y1 = currentCoord.foot + 10.5;
    const x2 = currentCoord.endX + currentCoord.endOffset + 0.5;

    const legOffset1 = y1 > mouse[1] ? 10 : -10;
    const legOffset2 = y1 > mouse[1] ? -10 : 10;

    return (
      <g stroke={viewMode ? "#0c0606ff" : "#ffffff"} fill="none">
        
        {/* Left leg */}
        {cursorState !== 0 && (<line
          x1={x1}
          y1={y1 + legOffset1}
          x2={x1}
          y2={mouse[1] + legOffset2}
          strokeWidth="1"
        />
        )}

        {/* Right leg when cursorState === 2 */}
        {cursorState === 2 && (
          <line
            x1={x2}
            y1={y1 + legOffset1}
            x2={x2}
            y2={mouse[1] + legOffset2}
            strokeWidth="1"
          />
        )}

        {/* Horizontal bar */}
        <line
          x1={x1}
          y1={mouse[1] + 0.5}
          x2={cursorState === 1 ? mouse[0] : x2}
          y2={mouse[1] + 0.5}
          strokeWidth="1"
        />
      </g>
    );
  };


  // --- ANNOTATIONS ---
  const annotationElements = annotations.map((annot, i) => {

    const x1 = annot.startX + annot.startOffset + 0.5;
    const y1 = annot.foot + 0.5;
    const x2 = annot.endX + annot.endOffset + 0.5;
    const y3 = annot.head + 0.5;
    const dash = annot.type?.includes("-") ? "6 6" : "none";
    const arrow = annot.type?.includes("<") || annot.type?.includes(">");
    return (
      <g key={"annot" + i} stroke={viewMode ? "#0c0606ff" : "#ffff"} fill="none">
        {/* Left leg */}
        <line
          x1={x1}
          y1={y1+ (y1 > y3 ? 10 : -10)}
          x2={x1}
          y2={y3+ (y1 > y3 ? -10 : 10)}
          strokeWidth="1"
          strokeDasharray={dash}
        />

        {/* Right leg */}
        <line
          x1={x2}
          y1={y1+ (y1 > y3 ? 10 : -10)}
          x2={x2}
          y2={y3+ (y1 > y3 ? -10 : 10)}
          strokeWidth="1"
          strokeDasharray={dash}
        />

        {/* Horizontal bar */}
        <line
          x1={x1}
          y1={y3}
          x2={x2}
          y2={y3}
          strokeWidth="1"
        />

         {/* Left triangle (arrow) */}
        {arrow && (<polygon
          points={`
            ${x1} ${y3} 
            ${x1 + 6} ${y3 - 4} 
            ${x1 + 6} ${y3 + 4}
          `}
          fill={viewMode ? "#0c0606ff" : "#ffff"}
        />
        )}
        {/* Right triangle (arrow) */}
        {arrow && (<polygon
          points={`
            ${x2} ${y3} 
            ${x2 - 6} ${y3 - 4} 
            ${x2 - 6} ${y3 + 4}
          `}
          fill={viewMode ? "#0c0606ff" : "#ffff"}
        />
        )}

        {/* Text centered on the bar */}
        <text
          x={Math.round((x1 + x2) / 2)}
          y={y3-8}
          textAnchor="middle"
          fill={viewMode ? "#0c0606ff" : "#ffffffff"}
          fontSize="14"
          fontFamily="Courier"
          fontWeight="normal"
        >
          {parseSubscript(annot.text)}
        </text>
      </g>
    );
  });

  return (
    <svg
      id="grid"
      ref={BGcanvasRef}
      width={timeStamp * dx + 10}
      height={signalCount * (dy + offsetY) + 5}
      style={{
        position: "absolute",
        top: 0,
        left: offsetX,
        zIndex: 1,
        backgroundColor: "transparent"
      }}
    >
      {gridLines}

      {/* MOUSE MARKER */}
      { annotationMode === 1 && (<line
        x1={mouse[0] + 0.5}
        y1={0.5}
        x2={mouse[0] + 0.5}
        y2={signalCount * (dy + offsetY) + 0.5}
        stroke= { cursorState === 0 ? "red" : (viewMode ? "#0c0606ff" : "#ffff")}
        strokeOpacity={0.4}
        strokeWidth={2}
        pointerEvents="none"
      />
      )}

      {/* DRAW ANNOTATIONS */}
      <CurrentCursor />
      {annotationElements}
      {timeLabels}
    </svg>
  );
}


function parseSubscript(text) {
  const parts = text.split(/(_[A-Za-z0-9]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("_")) {
      return (
        <tspan key={index} baselineShift="sub" fontSize="10">
          {part.substring(1)}   {/* skip underscore */}
        </tspan>
      );
    }
    return <tspan key={index}>{part}</tspan>;
  });
}
