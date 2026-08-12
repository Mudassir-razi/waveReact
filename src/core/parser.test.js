import { render } from "@testing-library/react";
import { AppConfigProvider } from "./config";
import WaveFormWindow from "./waveFormWindow";
import { checkError, flattenSignals } from "./parser";

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

const accepted = [
  ["a plain signal", [{ name: "a", wave: "10" }]],
  ["a group", [["core", { name: "a", wave: "10" }]]],
  ["every keyword at once", [
    { name: "a", wave: "=.", data: "x", color: "b", width: 2, scale: 1, phase: 0.5 },
  ]],
  // What the "Add new" button inserts.
  ["a repeat count in the wave", [{ name: "clock", wave: "p(.,10)" }]],
  ["a signal with only a name", [{ name: "spacer" }]],
  // The form the user guide teaches.
  ["bus labels as a list", [{ name: "addr", wave: "=.=.", data: ["A5", "3C"] }]],
  // An empty object is how a blank line is written.
  ["a blank line between signals", [{ name: "a", wave: "10" }, {}, { name: "b", wave: "01" }]],
  ["a blank line inside a group", [["core", { name: "a", wave: "10" }, {}]]],
];

const rejected = [
  ["a signal with no name", [{ wave: "10", data: "x" }], /Missing "name"/],
  ["a name that is not text", [{ name: 7, wave: "10" }], /"name" must be quoted text/],
  ["a wave that is not text", [{ name: "a", wave: 1010 }], /"wave" must be quoted text/],
  ["data that is neither text nor a list of it", [{ name: "a", wave: "=.", data: [7] }], /"data" must be quoted text/],
  ["a null entry", [null], /Invalid element type/],
  ["an unknown key", [{ name: "a", wave: "10", oops: 1 }], /Invalid key "oops"/],
];

describe("diagram validation", () => {
  it.each(accepted)("accepts %s", (_label, input) => {
    expect(() => checkError(input)).not.toThrow();
  });

  it.each(rejected)("rejects %s", (_label, input, message) => {
    expect(() => checkError(input)).toThrow(message);
  });

  it("points at the offending signal inside a group", () => {
    expect(() => checkError([["core", { wave: "10" }]])).toThrow(/root\[0\]\[1\]/);
  });

  // Each of these used to throw while drawing, which unmounts the whole editor.
  it.each(rejected)("refuses %s before it can break the render", (_label, input) => {
    expect(() => checkError(input)).toThrow();
  });

  it.each(accepted)("draws %s without throwing", (_label, input) => {
    expect(() =>
      render(
        <AppConfigProvider>
          <WaveFormWindow signals={input} anno={[]} mode="signal" state={0} />
        </AppConfigProvider>
      )
    ).not.toThrow();
  });

  // Emptying the editor used to be rejected, which left the previous diagram
  // on the canvas and exported it.
  it("accepts an empty diagram and draws nothing", () => {
    expect(() => checkError([])).not.toThrow();
    expect(() =>
      render(
        <AppConfigProvider>
          <WaveFormWindow signals={[]} anno={[]} mode="signal" state={0} />
        </AppConfigProvider>
      )
    ).not.toThrow();
  });
});

describe("flattening", () => {
  // A dropped row used to shift every name below it onto the wrong waveform.
  it("keeps a row that has a name but no wave", () => {
    const rows = flattenSignals([
      { name: "a", wave: "10" },
      { name: "spacer" },
      { name: "b", wave: "01" },
    ]);

    expect(rows.map((r) => r.name)).toEqual(["a", "spacer", "b"]);
  });

  it("keeps blank lines, which are what space signals apart", () => {
    const rows = flattenSignals([
      { name: "a", wave: "10" },
      {},
      { name: "b", wave: "01" },
    ]);

    expect(rows).toHaveLength(3);
    expect(Object.keys(rows[1])).toHaveLength(0);
  });

  it("keeps the row count in step with the name column across groups", () => {
    const rows = flattenSignals([
      { name: "a", wave: "10" },
      ["core", { name: "b" }, { name: "c", wave: "01" }],
    ]);

    expect(rows).toHaveLength(3);
  });
});
