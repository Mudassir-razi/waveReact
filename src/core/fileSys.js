export function combineAndSaveSVG(
  signalSvg,
  rulerSvg,
  nameSvg,
  totalWidth,
  totalHeight,
  filename = "combined.svg"
) {
  const SVG_NS = "http://www.w3.org/2000/svg";

  if (!signalSvg || !rulerSvg || !nameSvg) {
    console.warn("Missing SVG refs");
    return;
  }

  // Extract dimensions safely
  const nameWidth =
    signalNumber(nameSvg.getAttribute("width"));

  const signalWidth =
    signalNumber(signalSvg.getAttribute("width"));

  const nameHeight =
    signalNumber(nameSvg.getAttribute("height"));

  const signalHeight =
    signalNumber(signalSvg.getAttribute("height"));
  
  const rulerHeight = 
    signalNumber(rulerSvg.getAttribute("height"));

  const height = signalHeight + 70;

  // Create combined root
  const combinedSvg = document.createElementNS(SVG_NS, "svg");
  combinedSvg.setAttribute("xmlns", SVG_NS);
  combinedSvg.setAttribute("width", totalWidth);
  combinedSvg.setAttribute("height", totalHeight);
  combinedSvg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

  // Background
  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("width", totalWidth);
  bg.setAttribute("height", height);
  bg.setAttribute("fill", "#292929");
  combinedSvg.appendChild(bg);

  // Helper to copy children safely
  function appendSvgContent(sourceSvg, offsetX = 0, offsetY=0) {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("transform", `translate(${offsetX}, ${offsetY})`);

    Array.from(sourceSvg.childNodes).forEach(node => {
      group.appendChild(node.cloneNode(true));
    });

    combinedSvg.appendChild(group);
  }

  // Append name area
  appendSvgContent(nameSvg, 0, 0);

  // Append ruler
  appendSvgContent(rulerSvg, nameWidth, 0);

  // Append signal
  appendSvgContent(signalSvg, nameWidth, rulerHeight);

  return combinedSvg;
  // Serialize & download
  // const serializer = new XMLSerializer();
  // const svgString = serializer.serializeToString(combinedSvg);

  // const blob = new Blob([svgString], { type: "image/svg+xml" });
  // const url = URL.createObjectURL(blob);

  // const link = document.createElement("a");
  // link.href = url;
  // link.download = filename;
  // link.click();

  // URL.revokeObjectURL(url);
}

function signalNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}
