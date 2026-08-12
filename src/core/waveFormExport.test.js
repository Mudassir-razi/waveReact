import { render } from "@testing-library/react";
import { AppConfigProvider } from "./config";
import WaveFormWindow, { getSVG, getSVGString } from "./waveFormWindow";
import { combineAndSaveSVG } from "./fileSys";
import { serializeSvg } from "./svgOptimizer";

// Browser APIs the components use that jsdom does not provide.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  if (!global.structuredClone) {
    global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
  }
});

const DIAGRAM = [
  { name: "clk", wave: "p" + ".".repeat(39) },
  { name: "reset", wave: "10" + ".".repeat(38) },
  { name: "enable", wave: "0.1...0.1...0.1...0.1...0.1...0.1...0.1." },
  {
    name: "addr",
    wave: "x.3.4.5.3.4.5.3.4.5.3.4.5.3.4.5.3.4.5.x.".replace(/[345]/g, "="),
    data: "A0,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17",
  },
  [
    "core",
    { name: "state", wave: "0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1." },
    { name: "valid", wave: "01.0.1..0...1....0.1.0.1.0.1.0.1.0.1.0.1" },
    { name: "hiz", wave: "z1z0z1z0z1z0z1z0z1z0z1z0z1z0z1z0z1z0z1z0" },
  ],
];

const ANNOTATIONS = [
  { text: "t_su", start: 2, end: 6, head: 60, foot: 130 },
  { type: "curved", text: "cause", x1: 100, y1: 40, x2: 300, y2: 170 },
  { signalIndex: 2, timeStamp: 20, global: false },
];

function renderDiagram(anno = []) {
  return render(
    <AppConfigProvider>
      <WaveFormWindow signals={DIAGRAM} anno={anno} mode="signal" state={0} />
    </AppConfigProvider>
  );
}

describe("waveform SVG export", () => {
  it("produces a much smaller document than the raw layer merge", () => {
    renderDiagram();

    const raw = serializeSvg(
      combineAndSaveSVG(
        document.getElementById("mainLayer"),
        document.querySelectorAll("svg")[1],
        document.querySelectorAll("svg")[0],
        true
      )
    );
    const optimized = getSVGString();

    expect(optimized.length).toBeGreaterThan(0);
    expect(optimized.length).toBeLessThan(raw.length * 0.4);

    // Reported so the ratio is visible when the suite runs.
    console.log(
      `SVG export: ${raw.length} -> ${optimized.length} bytes ` +
        `(${(100 - (optimized.length / raw.length) * 100).toFixed(1)}% smaller)`
    );
  });

  it("keeps every signal and label in the optimized document", () => {
    renderDiagram();
    const optimized = getSVGString();

    for (const name of ["clk", "reset", "enable", "addr", "state", "valid", "hiz"]) {
      expect(optimized).toContain(`>${name}<`);
    }
    for (const label of ["A0", "A17"]) {
      expect(optimized).toContain(`>${label}<`);
    }
    // Ruler labels, every fifth cycle by default.
    expect(optimized).toContain(">40<");
    expect(optimized).not.toContain(">39<");
  });

  it("carries no interaction-only markup into the export", () => {
    renderDiagram();
    const optimized = getSVGString();

    expect(optimized).not.toContain("cursor-preview");
    expect(optimized).not.toContain("pointer-events");
    expect(optimized).not.toContain("class=");
    expect(optimized).not.toContain("tabindex");
    expect(optimized).not.toContain("user-select");
  });

  it("keeps annotations and break glyphs while dropping their hit targets", () => {
    renderDiagram(ANNOTATIONS);
    const svg = getSVG();
    const markup = getSVGString();

    // "t_su" is drawn as a base plus a subscript tspan.
    expect(markup).toContain(">t</tspan>");
    expect(markup).toContain('baseline-shift="sub">su</tspan>');
    expect(markup).toContain(">cause<");
    // The curved annotation keeps its cubic.
    expect(markup).toMatch(/<path d="M100 40[cC]/);
    // Break masks paint the canvas colour over the trace and must survive.
    expect(svg.querySelectorAll("rect").length).toBeGreaterThan(1);
    // The transparent rects and circles that exist only to be clicked must not.
    expect(markup).not.toContain("transparent");
  });

  it("still declares a viewBox that matches its size", () => {
    renderDiagram();
    const svg = getSVG();

    expect(svg.getAttribute("viewBox")).toBe(
      `0 0 ${svg.getAttribute("width")} ${svg.getAttribute("height")}`
    );
  });
});
