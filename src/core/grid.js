import React, { useMemo } from "react";

export const Grid = React.memo(function Grid({
  config,
  maxWaveLength,
  signalCount
}) {

  const lines = useMemo(() => {
    const result = [];
    const totalHeight =
      (signalCount + 1) * (config.dy + config.offsetY);

    for (let i = 0; i <= maxWaveLength; i++) {
      const x = i * config.dx;

      result.push(
        <line
          key={i}
          className="grid-line"
          x1={x + 0.5}
          y1={15}
          x2={x + 0.5}
          y2={totalHeight - 15}
          stroke="lightgrey"
          strokeOpacity={0.4}
          strokeWidth={1}
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      );
    }

    return result;
  }, [config, maxWaveLength, signalCount]);

  return <>{lines}</>;
});

export const Cursor = React.memo(function Cursor({ mouseX, height }) {
  if (mouseX == null) return null;

  return (
    <g pointerEvents="none">
      <line
        x1={mouseX}
        y1={0}
        x2={mouseX}
        y2={height}
        stroke="red"
        strokeWidth={1}
      />
      <line
        x1={mouseX + 15}
        y1={0}
        x2={mouseX + 15}
        y2={height}
        stroke="red"
        strokeWidth={1}
      />
    </g>
  );
});
