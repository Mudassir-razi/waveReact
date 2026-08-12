/** Canvas fill used to mask signals at break discontinuities. */
export function getCanvasFill(darkMode) {
  return darkMode ? "#111111" : "#ffffff";
}

/** Shared vertical layout for signal rows, grid, and break marks. */
export function getSignalWaveY(signalIndex, dy, offsetY) {
  return signalIndex * (dy + offsetY) + 15;
}

export function getSignalRowCenterY(signalIndex, dy, offsetY) {
  return getSignalWaveY(signalIndex, dy, offsetY) + dy / 2;
}

/** Top/bottom bounds for a break mark spanning one signal row plus margin. */
export function getSignalBreakBounds(signalIndex, dy, offsetY, margin = 5) {
  const waveY = getSignalWaveY(signalIndex, dy, offsetY);
  return {
    top: waveY - margin,
    bottom: waveY + dy + margin,
    center: waveY + dy / 2,
  };
}
