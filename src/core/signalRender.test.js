import { render } from "@testing-library/react";
import { AppConfigProvider } from "./config";
import WaveFormWindow, { getSVGString } from "./waveFormWindow";
import { expandWavePattern } from "./waveFormWindowManager";

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

function draw(signals) {
  render(
    <AppConfigProvider>
      <WaveFormWindow signals={signals} anno={[]} mode="signal" state={0} />
    </AppConfigProvider>
  );
  return getSVGString();
}

describe("signal rendering", () => {
  // A bus used to be emitted only when the next state closed it, so the last
  // one in a wave was drawn hollow and lost its label.
  it("fills and labels a bus that ends the wave", () => {
    const markup = draw([{ name: "b", wave: "0.=.a.", data: "one,two" }]);

    expect(markup.match(/fill="#[0-9a-f]{8}"/g)).toHaveLength(2);
    expect(markup).toContain(">one<");
    expect(markup).toContain(">two<");
  });

  it("does not double up when the wave ends on a level", () => {
    const markup = draw([{ name: "b", wave: "0.=.a.0", data: "one,two" }]);

    expect(markup.match(/fill="#[0-9a-f]{8}"/g)).toHaveLength(2);
  });

  it("reads bus labels written as a list", () => {
    const markup = draw([{ name: "b", wave: "=.=.", data: ["A5", "3C"] }]);

    expect(markup).toContain(">A5<");
    expect(markup).toContain(">3C<");
  });

  it("paints a trace with the colour keyword", () => {
    const markup = draw([{ name: "b", wave: "1010", color: "o" }]);

    expect(markup).toContain('stroke="#ffca7a"');
  });

  // "1(0,900000000)" used to throw RangeError, and counts just under the
  // string limit hung the tab instead.
  it("caps a runaway repeat count instead of hanging", () => {
    expect(expandWavePattern("1(0,900000000)").length).toBeLessThan(20000);
    expect(expandWavePattern("p(.,10)")).toBe("p..........");
  });

  it("keeps every bus colour distinct from the background", () => {
    const markup = draw([
      { name: "b", wave: "=.a.b.c.o.y.g.r.v.m.0", data: "1,2,3,4,5,6,7,8,9,10" },
    ]);

    // "=" and "a" were named colours that the darkener could not read, and
    // both used to collapse to black.
    expect(markup).toContain("#cccccc50");
    expect(markup).toContain("#4d4d4d50");
    expect(markup).not.toContain("#00000050");
  });
});
