import {
  measureContentBounds,
  optimizeSvgElement,
} from "./svgOptimizer";

/**
 * Merges the name panel, the time ruler and the waveform canvas into one
 * standalone SVG document.
 *
 * @param {SVGSVGElement} signalSvg Waveform canvas layer.
 * @param {SVGSVGElement} rulerSvg Time ruler layer.
 * @param {SVGSVGElement} nameSvg Signal name panel layer.
 * @param {boolean} darkMode Selects the background colour.
 * @param {{crop?: boolean, optimize?: boolean, padding?: number, optimizeOptions?: object}} [exportOptions]
 *   `crop` shrinks the document to the drawn content instead of the editing
 *   canvas, `optimize` compresses the markup. Both are meant for export only;
 *   they cost a layout pass and a full tree rewrite.
 * @returns {SVGSVGElement|null}
 */
export function combineAndSaveSVG(
  signalSvg,
  rulerSvg,
  nameSvg,
  darkMode = true,
  exportOptions = {}
) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const {
    crop = false,
    optimize = false,
    padding = 2,
    optimizeOptions,
  } = exportOptions;

  if (!signalSvg || !rulerSvg || !nameSvg) {
    console.warn("Missing SVG refs");
    return null;
  }

  const nameWidth = signalNumber(nameSvg.getAttribute("width"));
  const signalWidth = signalNumber(signalSvg.getAttribute("width"));
  const signalHeight = signalNumber(signalSvg.getAttribute("height"));
  const rulerHeight = signalNumber(rulerSvg.getAttribute("height"));

  let combinedWidth = nameWidth + signalWidth;
  let combinedHeight = rulerHeight + signalHeight;

  const combinedSvg = document.createElementNS(SVG_NS, "svg");
  combinedSvg.setAttribute("xmlns", SVG_NS);

  function appendSvgContent(sourceSvg, offsetX = 0, offsetY = 0) {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("transform", `translate(${offsetX}, ${offsetY})`);

    Array.from(sourceSvg.childNodes).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.getAttribute?.("id") === "cursor-preview") return;

      const clone = node.cloneNode(true);
      clone.querySelector?.("#cursor-preview")?.remove();
      group.appendChild(clone);
    });

    combinedSvg.appendChild(group);
  }

  // The name panel is laid out beside the ruler rather than below it, and its
  // labels already carry the ruler offset in their own coordinates, so it goes
  // in unshifted. Only the waveform canvas sits below the ruler.
  appendSvgContent(nameSvg, 0, 0);
  appendSvgContent(rulerSvg, nameWidth, 0);
  appendSvgContent(signalSvg, nameWidth, rulerHeight);

  // Compress first: dropping the invisible nodes keeps them from inflating the
  // measured extent, and the background is added afterwards so it cannot
  // define the bounds itself.
  if (optimize) optimizeSvgElement(combinedSvg, optimizeOptions);

  if (crop) {
    const bounds = measureContentBounds(combinedSvg);
    if (bounds) {
      combinedWidth = clampSize(bounds.maxX + padding, combinedWidth);
      combinedHeight = clampSize(bounds.maxY + padding, combinedHeight);
    }
  }

  combinedSvg.setAttribute("width", combinedWidth);
  combinedSvg.setAttribute("height", combinedHeight);
  combinedSvg.setAttribute("viewBox", `0 0 ${combinedWidth} ${combinedHeight}`);

  const bg = document.createElementNS(SVG_NS, "rect");
  bg.setAttribute("width", combinedWidth);
  bg.setAttribute("height", combinedHeight);
  bg.setAttribute("fill", darkMode ? "#111" : "#fff");
  combinedSvg.insertBefore(bg, combinedSvg.firstChild);

  return combinedSvg;
}

function clampSize(value, limit) {
  return Math.max(1, Math.min(limit, Math.ceil(value)));
}

function signalNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 
 * @param {JSON} data -JSON data to save
 * @param {string} filename -name of the file 
 */
export function saveJSONFile(data, filename = "data.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


/**
 * 
 * @returns Opens up a json file
 */
export function openJSONFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        resolve(json);
      } catch (err) {
        reject(new Error("Invalid JSON file"));
      } finally {
        document.body.removeChild(input);
      }
    };

    input.onerror = () => {
      reject(new Error("File input error"));
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}
