export function combineAndSaveSVG(
  signalSvg,
  gridSvg,
  nameSvg,
  filename = "combined.svg"
) {
  const SVG_NS = "http://www.w3.org/2000/svg";

  if (!signalSvg || !gridSvg || !nameSvg) return;

  // Extract dimensions
  const nameWidth = parseFloat(nameSvg.getAttribute("width")) || 0;
  const signalWidth = parseFloat(signalSvg.getAttribute("width")) || 0;
  const height = Math.max(
    parseFloat(signalSvg.getAttribute("height")) || 0,
    parseFloat(nameSvg.getAttribute("height")) || 0
  );

  const totalWidth = nameWidth + signalWidth;

  // Create new root SVG
  const combinedSvg = document.createElementNS(SVG_NS, "svg");
  combinedSvg.setAttribute("xmlns", SVG_NS);
  combinedSvg.setAttribute("width", totalWidth);
  combinedSvg.setAttribute("height", height);

  // Optional background
  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("width", totalWidth);
  bg.setAttribute("height", height);
  bg.setAttribute("fill", "#1e1e1e");
  combinedSvg.appendChild(bg);

  // Clone name SVG content
  const nameGroup = document.createElementNS(SVG_NS, "g");
  nameGroup.setAttribute("transform", `translate(0, 0)`);
  nameGroup.innerHTML = nameSvg.innerHTML;
  combinedSvg.appendChild(nameGroup);

  // Clone grid content
  const gridGroup = document.createElementNS(SVG_NS, "g");
  gridGroup.setAttribute("transform", `translate(${nameWidth}, 0)`);
  gridGroup.innerHTML = gridSvg.innerHTML;
  combinedSvg.appendChild(gridGroup);

  // Clone signal content
  const signalGroup = document.createElementNS(SVG_NS, "g");
  signalGroup.setAttribute("transform", `translate(${nameWidth}, 0)`);
  signalGroup.innerHTML = signalSvg.innerHTML;
  combinedSvg.appendChild(signalGroup);

  // Serialize
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(combinedSvg);

  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
