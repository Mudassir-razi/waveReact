import { getLineSegment, initRender } from "./segmentRenderer";
import {
  formatNumber,
  optimizePathData,
  optimizeSvgElement,
  serializeSvg,
} from "./svgOptimizer";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Rebuilds a waveform path the same way <Signal> does, one wave character at a
 * time, so the tests run against realistic input.
 */
function buildWavePath(wave, { dx = 30, scale = 1 } = {}) {
  initRender(dx, 22, 4, 15, scale, true);
  let d = "";
  let lastValid = wave[0] === "0" ? "1" : "0";

  for (let i = 0; i < wave.length; i++) {
    const current = wave[i];
    const currentState = current === "." ? "." : current.toUpperCase();
    d += getLineSegment(currentState, lastValid.toUpperCase(), i * dx * scale);
    if (current !== ".") lastValid = current;
  }
  return d;
}

// --- independent path flattener, deliberately not sharing the optimizer's ---

function flatten(d) {
  const tokens = d.match(/[MmLlHhVvZz]|-?(?:\d*\.\d+|\d+\.?)/g) || [];
  const segments = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let command = "";
  let i = 0;

  const number = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) {
      command = tokens[i];
      i++;
      if (command === "Z" || command === "z") {
        segments.push([x, y, startX, startY]);
        x = startX;
        y = startY;
        continue;
      }
    } else if (command === "M") command = "L";
    else if (command === "m") command = "l";

    const fromX = x;
    const fromY = y;

    switch (command) {
      case "M": x = number(); y = number(); startX = x; startY = y; continue;
      case "m": x += number(); y += number(); startX = x; startY = y; continue;
      case "L": x = number(); y = number(); break;
      case "l": x += number(); y += number(); break;
      case "H": x = number(); break;
      case "h": x += number(); break;
      case "V": y = number(); break;
      case "v": y += number(); break;
      default: i++; continue;
    }
    segments.push([fromX, fromY, x, y]);
  }

  return segments;
}

/**
 * Splits every segment at every vertex of either path, then compares the two
 * as unordered sets of pieces. Two paths that paint the same picture produce
 * the same set no matter how their vertices are grouped into subpaths.
 */
function coverage(segments, breakpoints) {
  const pieces = new Set();

  for (const [x1, y1, x2, y2] of segments) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) continue;

    const cuts = [0, 1];
    for (const [px, py] of breakpoints) {
      const cross = (px - x1) * dy - (py - y1) * dx;
      if (Math.abs(cross) > 1e-6) continue;
      const t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
      if (t > 1e-9 && t < 1 - 1e-9) cuts.push(t);
    }
    cuts.sort((a, b) => a - b);
    for (let i = cuts.length - 1; i > 0; i--) {
      if (cuts[i] - cuts[i - 1] < 1e-9) cuts.splice(i, 1);
    }

    for (let i = 0; i < cuts.length - 1; i++) {
      const a = [x1 + dx * cuts[i], y1 + dy * cuts[i]];
      const b = [x1 + dx * cuts[i + 1], y1 + dy * cuts[i + 1]];
      const key = [a, b]
        .map(([px, py]) => `${px.toFixed(3)},${py.toFixed(3)}`)
        .sort()
        .join(">");
      pieces.add(key);
    }
  }

  return pieces;
}

function expectSameDrawing(original, optimized) {
  const a = flatten(original);
  const b = flatten(optimized);
  const breakpoints = [...a, ...b].flatMap(([x1, y1, x2, y2]) => [[x1, y1], [x2, y2]]);

  const coverageA = coverage(a, breakpoints);
  const coverageB = coverage(b, breakpoints);

  expect([...coverageB].sort()).toEqual([...coverageA].sort());
}

describe("formatNumber", () => {
  it("drops the leading zero and trailing noise", () => {
    expect(formatNumber(0.5, 2)).toBe(".5");
    expect(formatNumber(-0.5, 2)).toBe("-.5");
    expect(formatNumber(30.0, 2)).toBe("30");
    expect(formatNumber(1 / 3, 2)).toBe(".33");
    expect(formatNumber(-0.001, 2)).toBe("0");
  });
});

describe("optimizePathData", () => {
  const waves = [
    "1.........",
    "0101010101",
    "01.1.0.0.1",
    "zzz111zzz000",
    "pnpnpn",
    "hlhlhl01z.",
    "1..0..1..z..1",
  ];

  it.each(waves)("keeps the drawing identical for wave %s", (wave) => {
    const original = buildWavePath(wave);
    const optimized = optimizePathData(original, { precision: 2, join: true });
    expectSameDrawing(original, optimized);
  });

  it("keeps the drawing identical for fractional scales", () => {
    const original = buildWavePath("01.1.0.1z.", { scale: 0.5 });
    const optimized = optimizePathData(original, { precision: 2, join: true });
    expectSameDrawing(original, optimized);
  });

  it("collapses a held level into a rising edge plus one straight line", () => {
    const original = buildWavePath("1.........");
    const optimized = optimizePathData(original, { precision: 2, join: true });

    // Rise out of the implicit low start, then 292 units of held high.
    expect(optimized).toBe("M.5 37.5h3l5-22h292");
    expect(optimized.length).toBeLessThan(original.length / 10);
  });

  it("preserves a retrace instead of folding it away", () => {
    // Out and back along the same line: dropping the far point would shorten
    // the stroke, so the middle vertex has to survive.
    const optimized = optimizePathData("M0 0 L30 0 L0 0", { precision: 2, join: true });
    expectSameDrawing("M0 0 L30 0 L0 0", optimized);
  });

  it("leaves disjoint subpaths disjoint", () => {
    const grid = "M 0.5 15 V 100 M 30.5 15 V 100 M 60.5 15 V 100 ";
    const optimized = optimizePathData(grid, { precision: 2, join: true });

    expect(optimized.match(/[Mm]/g)).toHaveLength(3);
    expectSameDrawing(grid, optimized);
  });

  it("compresses a long bus-free waveform by a large factor", () => {
    const original = buildWavePath("01".repeat(40));
    const optimized = optimizePathData(original, { precision: 2, join: true });

    expectSameDrawing(original, optimized);
    expect(optimized.length).toBeLessThan(original.length / 2);
  });
});

describe("optimizeSvgElement", () => {
  function makeSvg(inner) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("xmlns", SVG_NS);
    svg.innerHTML = inner;
    return svg;
  }

  it("merges a run of identically styled ticks into one path", () => {
    const ticks = Array.from({ length: 5 }, (_, i) =>
      `<line x1="${i * 30 + 0.5}" y1="12" x2="${i * 30 + 0.5}" y2="20" stroke="#747474" stroke-width="1" shape-rendering="crispEdges"/>`
    ).join("");

    const svg = makeSvg(`<g>${ticks}</g>`);
    const before = serializeSvg(svg).length;
    optimizeSvgElement(svg);

    expect(svg.querySelectorAll("line")).toHaveLength(0);
    expect(svg.querySelectorAll("path")).toHaveLength(1);
    expect(svg.querySelector("path").getAttribute("stroke")).toBe("#747474");
    expect(serializeSvg(svg).length).toBeLessThan(before / 2);
  });

  const labelMarkup = (count) =>
    Array.from({ length: count }, (_, i) =>
      `<text x="${i * 30 + 1}" y="10" fill="#808080" font-size="10" font-family="courier" text-anchor="middle">${i}</text>`
    ).join("");

  it("states attributes shared by every child once on the parent", () => {
    const svg = makeSvg(`<g>${labelMarkup(6)}</g>`);
    optimizeSvgElement(svg);

    const group = svg.querySelector("g");
    expect(group.getAttribute("font-family")).toBe("courier");
    expect(group.getAttribute("fill")).toBe("#808080");
    expect(group.querySelectorAll("text")).toHaveLength(6);
    expect(group.querySelector("text").hasAttribute("font-size")).toBe(false);
  });

  it("moves the offset a row of labels shares into the group transform", () => {
    const svg = makeSvg(`<g>${labelMarkup(6)}</g>`);
    const before = serializeSvg(svg).length;
    optimizeSvgElement(svg);

    const group = svg.querySelector("g");
    // Every label sat at y=10 and the first at x=1, so the pair moves up once
    // and the children are rebased against it.
    expect(group.getAttribute("transform")).toBe("translate(1 10)");
    const labels = Array.from(group.querySelectorAll("text"));
    expect(labels.some((label) => label.hasAttribute("y"))).toBe(false);
    expect(labels[0].hasAttribute("x")).toBe(false);
    expect(labels[1].getAttribute("x")).toBe("30");
    expect(serializeSvg(svg).length).toBeLessThan(before / 2);
  });

  it("leaves positions alone when a transform would not pay for itself", () => {
    const svg = makeSvg('<g><text x="3" y="7">a</text><text x="9" y="8">b</text></g>');
    optimizeSvgElement(svg);

    expect(serializeSvg(svg)).toContain('<text x="3" y="7">a</text>');
  });

  it("keeps positions put when the labels carry their own transform", () => {
    const label = '<text x="5" y="9" transform="rotate(-90)" font-size="9">';
    const svg = makeSvg(`<g>${label}a</text>${label}b</text></g>`);
    optimizeSvgElement(svg);

    // rotate() would reinterpret any offset we hoisted, so x/y stay put.
    for (const text of svg.querySelectorAll("text")) {
      expect(text.getAttribute("x")).toBe("5");
      expect(text.getAttribute("y")).toBe("9");
    }
  });

  it("wraps only the siblings that share attributes", () => {
    const svg = makeSvg(
      `<g><rect width="10" height="10" fill="#123456"/>${labelMarkup(6)}</g>`
    );
    optimizeSvgElement(svg);

    // The empty outer group is dropped, leaving the rect beside the wrapper.
    const wrapper = svg.querySelector("g");
    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute("font-family")).toBe("courier");
    expect(wrapper.querySelectorAll("text")).toHaveLength(6);
    expect(svg.querySelector("rect").getAttribute("fill")).toBe("#123456");
  });

  it("never puts a group inside a text element", () => {
    const svg = makeSvg(
      '<text fill="#fff">' +
        '<tspan x="10" y="20" font-size="12">A0</tspan>' +
        '<tspan x="40" y="20" font-size="12">A1</tspan>' +
        '<tspan x="70" y="20" font-size="12">A2</tspan>' +
        "</text>"
    );
    optimizeSvgElement(svg);

    expect(svg.querySelector("text g")).toBeNull();
    expect(svg.querySelectorAll("tspan")).toHaveLength(3);
    // The repeated size moves onto the <text> instead.
    expect(svg.querySelector("text").getAttribute("font-size")).toBe("12");
    expect(svg.querySelector("tspan").hasAttribute("font-size")).toBe(false);
  });

  it("drops interaction-only nodes and attributes", () => {
    const svg = makeSvg(
      '<g id="timing-annotations" tabindex="0" focusable="true" style="outline: none">' +
        '<rect x="10" y="10" width="12" height="30" fill="transparent"/>' +
        '<foreignObject x="0" y="0" width="120" height="30"><input/></foreignObject>' +
        '<text class="dynamic-text" pointer-events="none" fill="#8ec5f0"></text>' +
        '<line x1="10" y1="10" x2="10" y2="40" stroke="#6b9fd4" stroke-width="1"/>' +
        "</g>"
    );

    optimizeSvgElement(svg);
    const markup = serializeSvg(svg);

    expect(markup).not.toContain("foreignObject");
    expect(markup).not.toContain("transparent");
    expect(markup).not.toContain("pointer-events");
    expect(markup).not.toContain("tabindex");
    expect(markup).not.toContain("dynamic-text");
    expect(markup).not.toContain("stroke-width");
    expect(svg.querySelectorAll("line")).toHaveLength(1);
  });

  it("removes definitions that nothing references but keeps used ones", () => {
    const defs =
      '<defs><pattern id="my-hatch-pattern" width="5" height="5"><path d="M 0 0 L 0 5" stroke="#ffffff"/></pattern></defs>';

    const unused = makeSvg(`${defs}<path d="M 0 0 L 10 0" stroke="#fff" fill="none"/>`);
    optimizeSvgElement(unused);
    expect(unused.querySelector("pattern")).toBeNull();

    const used = makeSvg(`${defs}<path d="M 0 0 L 10 10 L 0 10 Z" fill="url(#my-hatch-pattern)"/>`);
    optimizeSvgElement(used);
    expect(used.querySelector("pattern")).not.toBeNull();
    expect(used.querySelector("pattern").getAttribute("id")).toBe("my-hatch-pattern");
  });

  it("keeps a dashed stroke split so its dash phase does not shift", () => {
    const dashed =
      '<path d="M 0 10 L 30 10 M 30 10 L 60 10" stroke="#fff" fill="none" stroke-dasharray="4 4"/>';

    const svg = makeSvg(dashed);
    optimizeSvgElement(svg);

    expect(svg.querySelector("path").getAttribute("d").match(/[Mm]/g)).toHaveLength(2);
  });
});
