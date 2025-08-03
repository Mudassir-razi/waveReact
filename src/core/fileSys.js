/**
 * Combines SVG objects and saves it in the device
 * @param {svg} signalSvg -SVG component that has the waveform 
 * @param {svg} gridSvg -SVG component that holds the background grid 
 * @param {svg} nameSvg -SVG component that holds the names of the signals 
 * @param {string} filename -Output filename 
 */
export function combineAndSaveSVG(signalSvg, gridSvg, nameSvg, filename = 'combined.svg') {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Extract widths and height
  const nameWidth = parseFloat(nameSvg.getAttribute('width') || 0);
  const signalWidth = parseFloat(signalSvg.getAttribute('width') || 0);
  const gridHeight = parseFloat(gridSvg.getAttribute('height') || 0);
  const totalWidth = nameWidth + signalWidth;

  // Create a combined SVG
  const combinedSVG = document.createElementNS(SVG_NS, 'svg');
  combinedSVG.setAttribute('xmlns', SVG_NS);
  combinedSVG.setAttribute('width', totalWidth);
  combinedSVG.setAttribute('height', gridHeight);
  combinedSVG.setAttribute('viewBox', `0 0 ${totalWidth} ${gridHeight}`);

  // Helper: clone and translate group
  function cloneGroup(sourceSvg, offsetX = 0) {
    const g = document.createElementNS(SVG_NS, 'g');

    if (offsetX !== 0) {
      g.setAttribute('transform', `translate(${offsetX}, 0)`);
    }

    // Copy children
    Array.from(sourceSvg.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        g.appendChild(node.cloneNode(true));
      }
    });

    return g;
  }

  // Step 1: grid (shifted right)
  const gridGroup = cloneGroup(gridSvg, nameWidth);
  removeSvgChildrenById(gridGroup, ['selectionRect', 'selectionLine1', 'selectionLine2']);
  // Step 2: signal (shifted right)
  const signalGroup = cloneGroup(signalSvg, nameWidth);

  // Step 3: name (at x = 0)
  const nameGroup = cloneGroup(nameSvg, 0);
  nameGroup.setAttribute("font-family", "monospace");
  nameGroup.setAttribute("font-weight", "bold");

  // Append layers in back-to-front order
  combinedSVG.appendChild(gridGroup);   // back
  combinedSVG.appendChild(signalGroup); // middle
  combinedSVG.appendChild(nameGroup);   // front


  // Serialize and download
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(combinedSVG);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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


/**
 * 
 * @param {JSON} data -JSON data to save
 * @param {string} filename -name of the file 
 */
export function saveJSONFile(data, filename = "data.json") {
  const json = JSON.stringify(data, null, 2); // pretty-print with 2-space indent
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url); // cleanup
}


function removeSvgChildrenById(svgElement, idsToRemove) {
  idsToRemove.forEach(id => {
    const element = svgElement.querySelector(`#${id}`);
    if (element) {
      element.remove(); // Remove the element from the DOM
    }
  });
}