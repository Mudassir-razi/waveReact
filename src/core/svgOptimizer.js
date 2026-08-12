/**
 * Export-time SVG compressor.
 *
 * The on-screen SVG is built for interactivity: geometry is emitted one wave
 * character at a time, every element carries its own presentation attributes,
 * and invisible hit targets sit on top of the drawing. None of that is needed
 * in an exported file, so this module rewrites a cloned SVG tree into the
 * smallest markup that still paints exactly the same picture.
 *
 * All passes are lossless with respect to the rendered result. The only
 * geometric change is coordinate rounding, controlled by `precision`.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

export const DEFAULT_EXPORT_OPTIONS = {
  precision: 2,
  removeInvisible: true,
  joinSubpaths: true,
  // Joining the subpaths of a dashed stroke makes the dash pattern run
  // continuously instead of restarting at every wave character, which is a
  // visible (if subtle) difference. Off by default.
  joinDashedSubpaths: false,
  mergeShapes: true,
  groupAttributes: true,
};

const SHAPE_TAGS = new Set([
  "path",
  "line",
  "polyline",
  "polygon",
  "rect",
  "circle",
  "ellipse",
]);

/** Presentation attributes that children inherit, so they can be hoisted. */
const INHERITABLE = new Set([
  "color",
  "fill",
  "fill-opacity",
  "fill-rule",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "paint-order",
  "shape-rendering",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "word-spacing",
]);

const PROPERTY_DEFAULTS = {
  fill: "#000",
  "fill-opacity": "1",
  "fill-rule": "nonzero",
  "font-style": "normal",
  "font-weight": "normal",
  opacity: "1",
  stroke: "none",
  "stroke-dasharray": "none",
  "stroke-dashoffset": "0",
  "stroke-linecap": "butt",
  "stroke-linejoin": "miter",
  "stroke-miterlimit": "4",
  "stroke-opacity": "1",
  "stroke-width": "1",
  "text-anchor": "start",
};

/** Attributes that only matter to a live document, never to a static file. */
const NON_VISUAL_ATTRS = new Set([
  "class",
  "cursor",
  "focusable",
  "pointer-events",
  "tabindex",
  "touch-action",
  "user-select",
]);

const NON_VISUAL_STYLE_PROPS = new Set([
  "cursor",
  "outline",
  "pointer-events",
  "touch-action",
  "user-select",
  "-webkit-user-select",
  "-moz-user-select",
  "-ms-user-select",
]);

const NUMERIC_ATTRS = new Set([
  "cx",
  "cy",
  "dx",
  "dy",
  "font-size",
  "height",
  "letter-spacing",
  "fill-opacity",
  "offset",
  "opacity",
  "r",
  "rx",
  "ry",
  "stop-opacity",
  "stroke-dashoffset",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "width",
  "x",
  "x1",
  "x2",
  "y",
  "y1",
  "y2",
]);

/** Geometry attributes, excluded from the "same styling" signature. */
const GEOMETRY_ATTRS = new Set([
  "cx",
  "cy",
  "d",
  "height",
  "points",
  "r",
  "rx",
  "ry",
  "width",
  "x",
  "x1",
  "x2",
  "y",
  "y1",
  "y2",
]);

const COLOR_KEYWORDS = {
  white: "#fff",
  black: "#000",
  aqua: "#0ff",
  fuchsia: "#f0f",
  yellow: "#ff0",
  red: "#f00",
  lime: "#0f0",
  blue: "#00f",
  cyan: "#0ff",
  magenta: "#f0f",
};

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export function formatNumber(value, precision) {
  const rounded = roundTo(value, precision);
  if (!Number.isFinite(rounded)) return "0";

  let text = String(rounded);
  if (text.includes("e")) text = rounded.toFixed(precision).replace(/\.?0+$/, "");
  if (text.startsWith("0.")) text = text.slice(1);
  else if (text.startsWith("-0.")) text = "-" + text.slice(2);
  return text === "-0" ? "0" : text;
}

function roundTo(value, precision) {
  const factor = 10 ** precision;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

// ---------------------------------------------------------------------------
// Path data
// ---------------------------------------------------------------------------

const COMMAND_ARITY = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

const PATH_TOKEN = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)/g;

/**
 * Splits path data into absolute subpaths.
 * Every segment carries its absolute coordinates plus its end point, so line
 * runs can be simplified without re-walking the command stream.
 */
function parseSubpaths(d) {
  const tokens = [];
  let match;
  PATH_TOKEN.lastIndex = 0;
  while ((match = PATH_TOKEN.exec(d)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else tokens.push(parseFloat(match[2]));
  }

  const subpaths = [];
  let current = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let i = 0;

  const ensureSubpath = () => {
    if (!current) {
      current = { start: [x, y], segs: [], closed: false };
      subpaths.push(current);
    }
    return current;
  };

  while (i < tokens.length) {
    if (typeof tokens[i] !== "string") {
      i++;
      continue;
    }

    let code = tokens[i];
    i++;
    const upper = code.toUpperCase();
    const arity = COMMAND_ARITY[upper];
    if (arity === undefined) continue;

    if (arity === 0) {
      if (current) {
        current.closed = true;
        x = startX;
        y = startY;
        current = null;
      }
      continue;
    }

    do {
      const args = [];
      for (let k = 0; k < arity; k++) {
        args.push(typeof tokens[i] === "number" ? tokens[i] : 0);
        i++;
      }

      const relative = code !== code.toUpperCase();
      const letter = code.toUpperCase();

      if (letter === "M") {
        x = relative ? x + args[0] : args[0];
        y = relative ? y + args[1] : args[1];
        startX = x;
        startY = y;
        current = { start: [x, y], segs: [], closed: false };
        subpaths.push(current);
      } else if (letter === "L" || letter === "T") {
        x = relative ? x + args[0] : args[0];
        y = relative ? y + args[1] : args[1];
        ensureSubpath().segs.push({ c: letter, a: [x, y] });
      } else if (letter === "H") {
        x = relative ? x + args[0] : args[0];
        ensureSubpath().segs.push({ c: "L", a: [x, y] });
      } else if (letter === "V") {
        y = relative ? y + args[0] : args[0];
        ensureSubpath().segs.push({ c: "L", a: [x, y] });
      } else {
        // Curves and arcs keep their control points; only the trailing pair is
        // the new current point. Arc flags are not coordinates, so shift them.
        const abs = args.slice();
        if (letter === "A") {
          abs[5] = relative ? x + args[5] : args[5];
          abs[6] = relative ? y + args[6] : args[6];
        } else {
          for (let k = 0; k < abs.length; k += 2) {
            abs[k] = relative ? x + args[k] : args[k];
            abs[k + 1] = relative ? y + args[k + 1] : args[k + 1];
          }
        }
        x = abs[abs.length - 2];
        y = abs[abs.length - 1];
        ensureSubpath().segs.push({ c: letter, a: abs });
      }

      // A repeated moveto argument pair is an implicit lineto.
      if (code === "M") code = "L";
      else if (code === "m") code = "l";
    } while (i < tokens.length && typeof tokens[i] === "number");
  }

  return subpaths;
}

function isLineOnly(subpath) {
  return subpath.segs.every((seg) => seg.c === "L");
}

function roundSubpath(subpath, precision) {
  subpath.start = [
    roundTo(subpath.start[0], precision),
    roundTo(subpath.start[1], precision),
  ];
  for (const seg of subpath.segs) {
    seg.a = seg.a.map((value, index) =>
      seg.c === "A" && index >= 2 && index <= 4 ? value : roundTo(value, precision)
    );
  }
}

/**
 * Drops points that add nothing: exact duplicates, and midpoints that continue
 * straight on in the same direction. Direction is checked so that a retrace
 * (out and back along one line, used by the Z-state glyph) survives.
 */
function simplifyLineRun(subpath) {
  const points = [subpath.start, ...subpath.segs.map((seg) => seg.a)];
  const kept = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const last = kept[kept.length - 1];
    if (point[0] === last[0] && point[1] === last[1]) continue;

    if (kept.length >= 2) {
      const before = kept[kept.length - 2];
      const ax = last[0] - before[0];
      const ay = last[1] - before[1];
      const bx = point[0] - last[0];
      const by = point[1] - last[1];
      const cross = ax * by - ay * bx;
      const forward = ax * bx + ay * by > 0;
      if (forward && Math.abs(cross) <= 1e-6 * Math.max(1, Math.hypot(ax, ay) * Math.hypot(bx, by))) {
        kept[kept.length - 1] = point;
        continue;
      }
    }
    kept.push(point);
  }

  // A stroke that collapsed to a single point still has to draw its cap.
  if (kept.length === 1 && points.length > 1) kept.push(points[points.length - 1]);

  subpath.start = kept[0];
  subpath.segs = kept.slice(1).map((point) => ({ c: "L", a: point }));
}

function endPoint(subpath) {
  if (!subpath.segs.length) return subpath.start;
  const last = subpath.segs[subpath.segs.length - 1];
  return [last.a[last.a.length - 2], last.a[last.a.length - 1]];
}

const pointKey = (point) => `${point[0]},${point[1]}`;

/**
 * Concatenates subpaths whose start point is exactly another subpath's end
 * point. This is where most of the size goes: consecutive wave characters are
 * emitted as separate subpaths even though they form one continuous trace.
 */
function joinSubpaths(subpaths) {
  const joinable = subpaths.filter((sp) => !sp.closed && sp.segs.length);
  if (joinable.length < 2) return subpaths;

  const byStart = new Map();
  const indexOf = new Map();
  joinable.forEach((sp, index) => {
    indexOf.set(sp, index);
    const key = pointKey(sp.start);
    if (!byStart.has(key)) byStart.set(key, []);
    byStart.get(key).push(index);
  });

  const consumed = new Set();
  const result = [];

  for (const subpath of subpaths) {
    const index = indexOf.get(subpath);
    if (index === undefined) {
      result.push(subpath);
      continue;
    }
    if (consumed.has(index)) continue;

    consumed.add(index);
    const chain = { start: subpath.start, segs: subpath.segs.slice(), closed: false };

    for (;;) {
      const candidates = byStart.get(pointKey(endPoint(chain)));
      if (!candidates) break;
      const next = candidates.find((candidate) => !consumed.has(candidate));
      if (next === undefined) break;
      consumed.add(next);
      chain.segs.push(...joinable[next].segs);
    }

    result.push(chain);
  }

  return result;
}

/** Emits path data, picking the shortest of absolute/relative and H/V per command. */
class PathWriter {
  constructor(precision) {
    this.out = "";
    this.precision = precision;
    this.previous = "";
    this.lastNumber = "";
  }

  static separatorNeeded(previousNumber, next) {
    if (next[0] === "-") return false;
    if (next[0] === "." && previousNumber.includes(".")) return false;
    return true;
  }

  cost(letter, values) {
    const omitLetter =
      letter === this.previous ||
      (this.previous === "M" && letter === "L") ||
      (this.previous === "m" && letter === "l");

    let length = omitLetter ? 0 : 1;
    let previousNumber = omitLetter ? this.lastNumber : "";
    for (const value of values) {
      const text = formatNumber(value, this.precision);
      if (previousNumber !== "" && PathWriter.separatorNeeded(previousNumber, text)) length++;
      length += text.length;
      previousNumber = text;
    }
    return length;
  }

  write(letter, values) {
    const omitLetter =
      letter === this.previous ||
      (this.previous === "M" && letter === "L") ||
      (this.previous === "m" && letter === "l");

    if (!omitLetter) {
      this.out += letter;
      this.lastNumber = "";
    }
    this.previous = letter;

    for (const value of values) {
      const text = formatNumber(value, this.precision);
      if (this.lastNumber !== "" && PathWriter.separatorNeeded(this.lastNumber, text)) {
        this.out += " ";
      }
      this.out += text;
      this.lastNumber = text;
    }
  }

  writeShortest(candidates) {
    let best = candidates[0];
    let bestCost = this.cost(best[0], best[1]);
    for (let i = 1; i < candidates.length; i++) {
      const cost = this.cost(candidates[i][0], candidates[i][1]);
      if (cost < bestCost) {
        best = candidates[i];
        bestCost = cost;
      }
    }
    this.write(best[0], best[1]);
  }
}

function writeSubpaths(subpaths, precision) {
  const writer = new PathWriter(precision);
  let cx = 0;
  let cy = 0;

  for (const subpath of subpaths) {
    const [sx, sy] = subpath.start;
    writer.writeShortest([
      ["M", [sx, sy]],
      ["m", [sx - cx, sy - cy]],
    ]);
    cx = sx;
    cy = sy;

    for (const seg of subpath.segs) {
      if (seg.c === "L") {
        const [x, y] = seg.a;
        if (y === cy && x !== cx) {
          writer.writeShortest([["H", [x]], ["h", [x - cx]]]);
        } else if (x === cx && y !== cy) {
          writer.writeShortest([["V", [y]], ["v", [y - cy]]]);
        } else {
          writer.writeShortest([["L", [x, y]], ["l", [x - cx, y - cy]]]);
        }
        cx = x;
        cy = y;
      } else if (seg.c === "A") {
        const a = seg.a;
        writer.writeShortest([
          ["A", a],
          ["a", [a[0], a[1], a[2], a[3], a[4], a[5] - cx, a[6] - cy]],
        ]);
        cx = a[5];
        cy = a[6];
      } else {
        const a = seg.a;
        const fromX = cx;
        const fromY = cy;
        const relative = a.map((value, index) =>
          index % 2 === 0 ? value - fromX : value - fromY
        );
        writer.writeShortest([
          [seg.c, a],
          [seg.c.toLowerCase(), relative],
        ]);
        cx = a[a.length - 2];
        cy = a[a.length - 1];
      }
    }

    if (subpath.closed) {
      writer.write("z", []);
      cx = subpath.start[0];
      cy = subpath.start[1];
    }
  }

  return writer.out;
}

/**
 * Rewrites path data into an equivalent but much shorter form.
 * @param {string} d Source path data.
 * @param {{precision?: number, join?: boolean}} options
 */
export function optimizePathData(d, options = {}) {
  if (!d || !d.trim()) return "";
  const precision = options.precision ?? DEFAULT_EXPORT_OPTIONS.precision;

  let subpaths = parseSubpaths(d);
  if (!subpaths.length) return "";

  for (const subpath of subpaths) {
    roundSubpath(subpath, precision);
    if (isLineOnly(subpath)) simplifyLineRun(subpath);
  }

  if (options.join) {
    subpaths = joinSubpaths(subpaths);
    for (const subpath of subpaths) {
      if (isLineOnly(subpath)) simplifyLineRun(subpath);
    }
  }

  return writeSubpaths(subpaths, precision);
}

// ---------------------------------------------------------------------------
// Attribute values
// ---------------------------------------------------------------------------

function normalizeColor(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const keyword = COLOR_KEYWORDS[trimmed.toLowerCase()];
  if (keyword) return keyword;

  const hex = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(trimmed);
  if (!hex) return trimmed;

  const digits = hex[1].toLowerCase();
  let short = "";
  for (let i = 0; i < digits.length; i += 2) {
    if (digits[i] !== digits[i + 1]) return "#" + digits;
    short += digits[i];
  }
  return "#" + short;
}

function optimizeNumberList(value, precision) {
  return value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((token) => {
      const number = parseFloat(token);
      return Number.isNaN(number) ? token : formatNumber(number, precision);
    })
    .join(" ");
}

function optimizePoints(value, precision) {
  const numbers = value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(parseFloat);

  const parts = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    parts.push(
      `${formatNumber(numbers[i], precision)},${formatNumber(numbers[i + 1], precision)}`
    );
  }
  return parts.join(" ");
}

function optimizeTransform(value, precision) {
  return value
    .replace(/([a-zA-Z]+)\s*\(([^)]*)\)/g, (_all, name, args) => {
      const numbers = args
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((token) => roundTo(parseFloat(token), precision));

      if (name === "translate" && numbers.length === 2 && numbers[1] === 0) numbers.pop();
      if (name === "scale" && numbers.length === 2 && numbers[0] === numbers[1]) numbers.pop();
      if (
        (name === "translate" || name === "rotate") &&
        numbers.length === 1 &&
        numbers[0] === 0
      ) {
        return "";
      }
      return `${name}(${numbers.map((n) => formatNumber(n, precision)).join(" ")})`;
    })
    .replace(/\)\s+(?=[a-zA-Z])/g, ") ")
    .trim();
}

function parseStyle(value) {
  const declarations = new Map();
  for (const chunk of value.split(";")) {
    const index = chunk.indexOf(":");
    if (index === -1) continue;
    const property = chunk.slice(0, index).trim().toLowerCase();
    const propertyValue = chunk.slice(index + 1).trim();
    if (property && propertyValue) declarations.set(property, propertyValue);
  }
  return declarations;
}

// ---------------------------------------------------------------------------
// DOM passes
// ---------------------------------------------------------------------------

function collectReferencedIds(root) {
  const referenced = new Set();
  const walk = (element) => {
    for (const attribute of Array.from(element.attributes || [])) {
      const matches = attribute.value.match(/url\(#([^)]+)\)/g);
      if (!matches) continue;
      for (const match of matches) referenced.add(match.slice(5, -1));
    }
    for (const child of Array.from(element.children)) walk(child);
  };
  walk(root);
  return referenced;
}

/**
 * Turns `style` into presentation attributes and removes everything that only
 * exists for interaction. Safe because the exported file carries no stylesheet.
 */
function inlineStyleAndStripNonVisual(element) {
  for (const name of NON_VISUAL_ATTRS) {
    if (element.hasAttribute(name)) element.removeAttribute(name);
  }

  const style = element.getAttribute("style");
  if (style === null) return;

  element.removeAttribute("style");
  for (const [property, value] of parseStyle(style)) {
    if (NON_VISUAL_STYLE_PROPS.has(property)) continue;
    if (property === "display" && value === "block") continue;
    if (property === "background-color") continue;
    element.setAttribute(property, value);
  }
}

function effectiveValue(element, inherited, property) {
  if (element.hasAttribute(property)) return element.getAttribute(property);
  if (INHERITABLE.has(property) && inherited[property] !== undefined) {
    return inherited[property];
  }
  return PROPERTY_DEFAULTS[property];
}

function isInvisible(element, inherited) {
  const tag = element.tagName.toLowerCase();
  if (!SHAPE_TAGS.has(tag) && tag !== "text") return false;

  const strokeless =
    ["none", "transparent"].includes(normalizeColor(effectiveValue(element, inherited, "stroke"))) ||
    parseFloat(effectiveValue(element, inherited, "stroke-opacity")) === 0 ||
    parseFloat(effectiveValue(element, inherited, "stroke-width")) === 0;

  // A line has no fillable area, so its fill can never make it visible.
  const fillless =
    tag === "line" ||
    ["none", "transparent"].includes(normalizeColor(effectiveValue(element, inherited, "fill"))) ||
    parseFloat(effectiveValue(element, inherited, "fill-opacity")) === 0;

  if (parseFloat(element.getAttribute("opacity") ?? "1") === 0) return true;
  return strokeless && fillless;
}

function isEmptyGeometry(element) {
  const tag = element.tagName.toLowerCase();
  if (tag === "path") return !(element.getAttribute("d") || "").trim();
  if (tag === "text") return !element.textContent.trim() && !element.children.length;
  if (tag === "polyline" || tag === "polygon") {
    return !(element.getAttribute("points") || "").trim();
  }
  if (tag === "rect") {
    return (
      parseFloat(element.getAttribute("width") || "0") === 0 ||
      parseFloat(element.getAttribute("height") || "0") === 0
    );
  }
  return false;
}

/** Folds a lone `<tspan>` back into its `<text>` parent. */
function collapseSingleTspan(element) {
  if (element.tagName.toLowerCase() !== "text") return;
  if (element.children.length !== 1) return;

  const tspan = element.children[0];
  if (tspan.tagName.toLowerCase() !== "tspan") return;
  if (tspan.children.length) return;
  // Any text directly under <text> would be reordered by the merge.
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) return;
  }

  for (const attribute of Array.from(tspan.attributes)) {
    element.setAttribute(attribute.name, attribute.value);
  }
  element.textContent = tspan.textContent;
}

/** `transform="translate(a b)"` on a text node is longer than plain x/y. */
function foldTranslateIntoText(element, precision) {
  if (element.tagName.toLowerCase() !== "text") return;

  const transform = element.getAttribute("transform");
  const match = transform && /^translate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+))?\s*\)$/.exec(transform);
  if (!match) return;

  const currentX = parseFloat(element.getAttribute("x") || "0");
  const currentY = parseFloat(element.getAttribute("y") || "0");
  if (currentX !== 0 || currentY !== 0) return;
  // Positioned children override the parent, so the shift would be lost.
  for (const child of Array.from(element.children)) {
    if (child.hasAttribute("x") || child.hasAttribute("y")) return;
  }

  element.removeAttribute("transform");
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2] || "0");
  if (x !== 0) element.setAttribute("x", formatNumber(x, precision));
  if (y !== 0) element.setAttribute("y", formatNumber(y, precision));
}

function cleanElement(element, inherited, options, referencedIds) {
  const tag = element.tagName.toLowerCase();
  const precision = options.precision;

  collapseSingleTspan(element);
  inlineStyleAndStripNonVisual(element);

  if (element.hasAttribute("id") && !referencedIds.has(element.getAttribute("id"))) {
    // A definition nobody points at can never paint anything.
    if (element.parentElement?.tagName.toLowerCase() === "defs") {
      element.remove();
      return false;
    }
    element.removeAttribute("id");
  }

  // x/y default to 0 on these, unlike <tspan> where an absent x continues the
  // previous run instead of resetting to the origin.
  if (tag === "text" || tag === "rect") {
    for (const name of ["x", "y"]) {
      if (parseFloat(element.getAttribute(name) || "0") === 0) element.removeAttribute(name);
    }
  }

  for (const attribute of Array.from(element.attributes)) {
    const { name } = attribute;
    let value = attribute.value;

    if (name === "d") {
      const dashed = effectiveValue(element, inherited, "stroke-dasharray");
      const filled = !["none", "transparent"].includes(
        normalizeColor(effectiveValue(element, inherited, "fill"))
      );
      const join =
        options.joinSubpaths &&
        !filled &&
        (options.joinDashedSubpaths || !dashed || dashed === "none");
      value = optimizePathData(value, { precision, join });
    } else if (name === "points") {
      value = optimizePoints(value, precision);
    } else if (name === "transform" || name === "patternTransform" || name === "gradientTransform") {
      value = optimizeTransform(value, precision);
    } else if (name === "viewBox" || name === "stroke-dasharray") {
      value = optimizeNumberList(value, precision);
    } else if (NUMERIC_ATTRS.has(name)) {
      const number = parseFloat(value);
      if (!Number.isNaN(number) && /^[-\d.eE+]+$/.test(value.trim())) {
        value = formatNumber(number, precision);
      }
    } else if (name === "fill" || name === "stroke" || name === "color" || name === "stop-color") {
      value = normalizeColor(value);
    }

    if (value === "") element.removeAttribute(name);
    else if (value !== attribute.value) element.setAttribute(name, value);
  }

  foldTranslateIntoText(element, precision);

  // Presentation attributes that restate what is already in effect.
  for (const attribute of Array.from(element.attributes)) {
    const { name, value } = attribute;
    if (PROPERTY_DEFAULTS[name] === undefined) continue;
    const active = INHERITABLE.has(name)
      ? inherited[name] ?? PROPERTY_DEFAULTS[name]
      : PROPERTY_DEFAULTS[name];
    if (value === active) element.removeAttribute(name);
  }

  const strokeOff = ["none", "transparent"].includes(
    normalizeColor(effectiveValue(element, inherited, "stroke"))
  );
  if (strokeOff && SHAPE_TAGS.has(tag)) {
    for (const name of ["stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-opacity"]) {
      element.removeAttribute(name);
    }
  }
  if (
    ["none", "transparent"].includes(normalizeColor(effectiveValue(element, inherited, "fill"))) &&
    SHAPE_TAGS.has(tag)
  ) {
    element.removeAttribute("fill-opacity");
    element.removeAttribute("fill-rule");
  }

  return true;
}

function cleanTree(element, inherited, options, referencedIds) {
  const tag = element.tagName.toLowerCase();

  if (tag === "foreignobject") {
    element.remove();
    return;
  }

  if (!cleanElement(element, inherited, options, referencedIds)) return;

  if (options.removeInvisible && (isInvisible(element, inherited) || isEmptyGeometry(element))) {
    element.remove();
    return;
  }

  const childInherited = { ...inherited };
  for (const attribute of Array.from(element.attributes)) {
    if (INHERITABLE.has(attribute.name)) childInherited[attribute.name] = attribute.value;
  }

  for (const child of Array.from(element.children)) {
    cleanTree(child, childInherited, options, referencedIds);
  }

  const container = tag === "g" || tag === "defs";
  if (container && !element.children.length && !element.textContent.trim()) element.remove();
}

// ---------------------------------------------------------------------------
// Shape merging
// ---------------------------------------------------------------------------

function inheritedFill(element) {
  let node = element.parentElement;
  while (node) {
    if (node.hasAttribute && node.hasAttribute("fill")) {
      return normalizeColor(node.getAttribute("fill"));
    }
    node = node.parentElement;
  }
  return PROPERTY_DEFAULTS.fill;
}

function shapeToPathData(element, precision) {
  const tag = element.tagName.toLowerCase();
  const number = (name) => parseFloat(element.getAttribute(name) || "0");

  if (tag === "path") return element.getAttribute("d") || "";
  if (tag === "line") {
    return `M${formatNumber(number("x1"), precision)} ${formatNumber(number("y1"), precision)}L${formatNumber(number("x2"), precision)} ${formatNumber(number("y2"), precision)}`;
  }
  if (tag === "polyline") {
    const points = optimizePoints(element.getAttribute("points") || "", precision);
    if (!points) return "";
    return "M" + points.replace(/,/g, " ").split(" ").reduce((acc, value, index) => {
      if (index === 0) return value;
      return index % 2 === 0 ? `${acc}L${value}` : `${acc} ${value}`;
    }, "");
  }
  return "";
}

/** Presentation signature: everything that is not geometry. */
function styleSignature(element) {
  return Array.from(element.attributes)
    .filter((attribute) => !GEOMETRY_ATTRS.has(attribute.name))
    .map((attribute) => `${attribute.name}=${attribute.value}`)
    .sort()
    .join("|");
}

function isMergeableShape(element) {
  const tag = element.tagName.toLowerCase();
  if (tag !== "path" && tag !== "line" && tag !== "polyline") return false;
  // Merging filled subpaths can change how the fill rule resolves overlaps.
  if (tag === "line") return true;
  const fill = element.hasAttribute("fill")
    ? normalizeColor(element.getAttribute("fill"))
    : inheritedFill(element);
  return fill === "none" || fill === "transparent";
}

/**
 * Collapses runs of adjacent siblings that share styling into a single path.
 * Only adjacent elements are merged so paint order is preserved.
 */
function mergeShapes(parent, options) {
  const children = Array.from(parent.children);
  let index = 0;

  while (index < children.length) {
    const first = children[index];
    if (!isMergeableShape(first)) {
      index++;
      continue;
    }

    const signature = styleSignature(first);
    let end = index + 1;
    while (
      end < children.length &&
      isMergeableShape(children[end]) &&
      styleSignature(children[end]) === signature
    ) {
      end++;
    }

    if (end - index >= 2) {
      const run = children.slice(index, end);
      const merged = parent.ownerDocument.createElementNS(SVG_NS, "path");
      for (const attribute of Array.from(first.attributes)) {
        if (!GEOMETRY_ATTRS.has(attribute.name)) {
          merged.setAttribute(attribute.name, attribute.value);
        }
      }

      const data = run
        .map((element) => shapeToPathData(element, options.precision))
        .filter(Boolean)
        .join("");

      const dashed = merged.getAttribute("stroke-dasharray");
      merged.setAttribute(
        "d",
        optimizePathData(data, {
          precision: options.precision,
          join: options.joinSubpaths && (options.joinDashedSubpaths || !dashed),
        })
      );
      if (!merged.hasAttribute("fill") && inheritedFill(first) !== "none") {
        merged.setAttribute("fill", "none");
      }

      parent.insertBefore(merged, first);
      for (const element of run) element.remove();
    }

    index = end;
  }

  for (const child of Array.from(parent.children)) mergeShapes(child, options);
}

// ---------------------------------------------------------------------------
// Attribute grouping
// ---------------------------------------------------------------------------

const attributeCost = (name, value) => name.length + value.length + 4;

const inheritableOf = (element) => {
  const map = new Map();
  for (const attribute of Array.from(element.attributes)) {
    if (INHERITABLE.has(attribute.name)) map.set(attribute.name, attribute.value);
  }
  return map;
};

/**
 * Moves attributes that every child states identically onto the parent.
 * Since each child spelled the value out, letting them inherit it resolves to
 * the same thing.
 */
function hoistToParent(element) {
  for (const child of Array.from(element.children)) hoistToParent(child);

  const children = Array.from(element.children);
  if (children.length < 2) return;

  let shared = inheritableOf(children[0]);
  for (let i = 1; i < children.length && shared.size; i++) {
    const next = inheritableOf(children[i]);
    const intersection = new Map();
    for (const [name, value] of shared) {
      if (next.get(name) === value) intersection.set(name, value);
    }
    shared = intersection;
  }

  for (const [name, value] of shared) {
    if (element.hasAttribute(name)) continue;
    element.setAttribute(name, value);
    for (const child of children) child.removeAttribute(name);
  }
}

/** Only these may hold a `<g>`; a group inside `<text>`, for one, is invalid. */
const GROUP_CONTAINERS = new Set(["svg", "g", "a"]);

/**
 * Wraps runs of adjacent siblings that repeat the same inheritable attributes
 * in a `<g>` that states them once. Only exact repeats are moved, so the value
 * every element resolves to is unchanged.
 */
function groupCommonAttributes(parent) {
  if (!GROUP_CONTAINERS.has(parent.tagName.toLowerCase())) {
    for (const child of Array.from(parent.children)) groupCommonAttributes(child);
    return;
  }

  const children = Array.from(parent.children);
  const savingsOf = (shared, count) => {
    let savings = -"<g></g>".length;
    for (const [name, value] of shared) savings += (count - 1) * attributeCost(name, value);
    return savings;
  };

  let index = 0;
  while (index < children.length) {
    let shared = inheritableOf(children[index]);
    let best = null;

    for (let end = index + 1; end < children.length + 1 && shared.size; end++) {
      if (end > index + 1) {
        const next = inheritableOf(children[end - 1]);
        const intersection = new Map();
        for (const [name, value] of shared) {
          if (next.get(name) === value) intersection.set(name, value);
        }
        if (!intersection.size) break;
        shared = intersection;
      }
      // Extending the run shares the wrapper across more elements but can also
      // shrink the shared set, so keep the best trade-off seen so far.
      const savings = savingsOf(shared, end - index);
      if (end - index >= 2 && savings > 0 && (!best || savings > best.savings)) {
        best = { end, savings, shared: new Map(shared) };
      }
    }

    if (best) {
      const run = children.slice(index, best.end);
      const group = parent.ownerDocument.createElementNS(SVG_NS, "g");
      for (const [name, value] of best.shared) group.setAttribute(name, value);

      parent.insertBefore(group, run[0]);
      for (const element of run) {
        for (const name of best.shared.keys()) element.removeAttribute(name);
        group.appendChild(element);
      }
      index = best.end;
    } else {
      index++;
    }
  }

  for (const child of Array.from(parent.children)) groupCommonAttributes(child);
}

/** Elements positioned by a plain `x`/`y` pair that a translate can absorb. */
const OFFSET_TAGS = new Set(["text", "rect", "image", "use"]);

/** A transform on the container would also move these, so leave those alone. */
const SPATIAL_REFERENCES = ["clip-path", "mask", "filter"];

const SINGLE_NUMBER = /^-?(?:\d*\.\d+|\d+\.?)$/;

function readOffsetCoordinate(element, name) {
  if (!element.hasAttribute(name)) return { cost: 0, value: 0 };
  const raw = element.getAttribute(name).trim();
  if (!SINGLE_NUMBER.test(raw)) return null;
  return { cost: attributeCost(name, raw), value: parseFloat(raw) };
}

/**
 * A column of labels states the same `x` (or a row the same `y`) on every
 * element. Naming the shared part once as a translate on their group and
 * rebasing the children against it draws the identical picture in less markup.
 */
function extractCommonOffset(container, precision) {
  const tag = container.tagName.toLowerCase();
  if (tag !== "g" && tag !== "a") return;
  if (SPATIAL_REFERENCES.some((name) => container.hasAttribute(name))) return;

  const existing = container.getAttribute("transform");
  let baseX = 0;
  let baseY = 0;
  if (existing !== null) {
    const translate = existing.match(/^translate\(\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?\s*\)$/);
    if (!translate) return;
    baseX = parseFloat(translate[1]);
    baseY = parseFloat(translate[2] ?? "0");
  }

  const children = Array.from(container.children);
  if (children.length < 2) return;

  const positions = [];
  for (const child of children) {
    if (!OFFSET_TAGS.has(child.tagName.toLowerCase())) return;
    if (child.hasAttribute("transform")) return;
    // A tspan carries its own absolute position in the same coordinate system.
    if (child.querySelector("[x],[y]")) return;

    const x = readOffsetCoordinate(child, "x");
    const y = readOffsetCoordinate(child, "y");
    if (!x || !y) return;
    positions.push({ child, x, y });
  }

  const currentCost = positions.reduce((total, p) => total + p.x.cost + p.y.cost, 0);
  const transformCost = (value) =>
    value === null ? 0 : attributeCost("transform", value) - (existing === null ? 0 : attributeCost("transform", existing));

  const candidateFor = (shiftX, shiftY) => {
    let cost = 0;
    for (const { x, y } of positions) {
      const nextX = roundTo(x.value - shiftX, precision);
      const nextY = roundTo(y.value - shiftY, precision);
      if (nextX !== 0) cost += attributeCost("x", formatNumber(nextX, precision));
      if (nextY !== 0) cost += attributeCost("y", formatNumber(nextY, precision));
    }
    const moved = shiftX !== 0 || shiftY !== 0 || existing !== null;
    if (!moved) return { cost, transform: null, shiftX, shiftY };

    const dx = formatNumber(roundTo(baseX + shiftX, precision), precision);
    const dy = formatNumber(roundTo(baseY + shiftY, precision), precision);
    const transform = dy === "0" ? `translate(${dx})` : `translate(${dx} ${dy})`;
    return { cost: cost + transformCost(transform), transform, shiftX, shiftY };
  };

  const minX = Math.min(...positions.map((p) => p.x.value));
  const minY = Math.min(...positions.map((p) => p.y.value));
  const best = [
    candidateFor(0, 0),
    candidateFor(minX, 0),
    candidateFor(0, minY),
    candidateFor(minX, minY),
  ].reduce((a, b) => (b.cost < a.cost ? b : a));

  if (best.cost >= currentCost || (best.shiftX === 0 && best.shiftY === 0)) return;

  for (const { child, x, y } of positions) {
    const nextX = roundTo(x.value - best.shiftX, precision);
    const nextY = roundTo(y.value - best.shiftY, precision);
    if (nextX === 0) child.removeAttribute("x");
    else child.setAttribute("x", formatNumber(nextX, precision));
    if (nextY === 0) child.removeAttribute("y");
    else child.setAttribute("y", formatNumber(nextY, precision));
  }
  if (best.transform) container.setAttribute("transform", best.transform);
}

function extractCommonOffsets(element, precision) {
  for (const child of Array.from(element.children)) extractCommonOffsets(child, precision);
  extractCommonOffset(element, precision);
}

/** Removes wrapper groups that no longer carry anything. */
function collapseGroups(element) {
  for (const child of Array.from(element.children)) collapseGroups(child);

  for (const child of Array.from(element.children)) {
    if (child.tagName.toLowerCase() !== "g") continue;

    if (!child.attributes.length) {
      while (child.firstChild) element.insertBefore(child.firstChild, child);
      child.remove();
      continue;
    }

    // A group holding one group can absorb it when their attributes disjoin.
    if (child.children.length === 1 && child.childNodes.length === 1) {
      const inner = child.children[0];
      if (inner.tagName.toLowerCase() !== "g") continue;
      const clash = Array.from(inner.attributes).some((attribute) =>
        child.hasAttribute(attribute.name)
      );
      if (clash) continue;
      for (const attribute of Array.from(inner.attributes)) {
        child.setAttribute(attribute.name, attribute.value);
      }
      while (inner.firstChild) child.insertBefore(inner.firstChild, inner);
      inner.remove();
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rewrites an SVG tree in place so it serializes to far less markup.
 * @param {SVGElement} root SVG element to compress (should be a detached clone).
 * @param {object} [options] See DEFAULT_EXPORT_OPTIONS.
 * @returns {SVGElement} The same element, compressed.
 */
export function optimizeSvgElement(root, options = {}) {
  if (!root) return root;
  const settings = { ...DEFAULT_EXPORT_OPTIONS, ...options };

  try {
    const referencedIds = collectReferencedIds(root);
    for (const child of Array.from(root.children)) {
      cleanTree(child, {}, settings, referencedIds);
    }
    if (settings.mergeShapes) mergeShapes(root, settings);
    if (settings.groupAttributes) {
      hoistToParent(root);
      groupCommonAttributes(root);
      extractCommonOffsets(root, settings.precision);
    }
    collapseGroups(root);
  } catch (error) {
    console.warn("SVG optimization skipped:", error);
  }

  return root;
}

/**
 * @param {SVGElement} root
 * @returns {string} Serialized, single-line SVG markup.
 */
export function serializeSvg(root) {
  if (!root) return "";
  const markup = new XMLSerializer().serializeToString(root);

  // Serializers disagree on whether an explicit xmlns attribute is re-emitted,
  // and a repeated one makes the document invalid XML.
  const rootTag = /^<svg\b[^>]*>/.exec(markup);
  if (!rootTag) return markup;

  let seen = false;
  const deduped = rootTag[0].replace(/\s+xmlns="[^"]*"/g, (match) => {
    if (seen) return "";
    seen = true;
    return match;
  });
  const withNamespace = seen ? deduped : deduped.replace("<svg", `<svg xmlns="${SVG_NS}"`);
  return withNamespace + markup.slice(rootTag[0].length);
}

/**
 * Measures the drawn extent of an element by rendering it off-screen.
 * Returns null when measurement is not possible (no layout engine).
 * @param {SVGElement} root
 * @returns {{minX:number,minY:number,maxX:number,maxY:number}|null}
 */
export function measureContentBounds(root) {
  if (!root || typeof document === "undefined") return null;

  const probe = root.cloneNode(true);
  probe.setAttribute("style", "position:fixed;left:-100000px;top:0;visibility:hidden");

  let bounds = null;
  try {
    document.body.appendChild(probe);
    // Measured on the root: a group's own transform is left out of its bbox,
    // but it is applied when the parent measures it.
    if (typeof probe.getBBox === "function") {
      const box = probe.getBBox();
      if (box && (box.width > 0 || box.height > 0)) {
        bounds = {
          minX: box.x,
          minY: box.y,
          maxX: box.x + box.width,
          maxY: box.y + box.height,
        };
      }
    }
  } catch (error) {
    bounds = null;
  } finally {
    probe.remove();
  }

  return bounds;
}
