import React from "react";
import { Container, Box, Typography, Paper, Divider } from "@mui/material";

function GuideExample({ title, description, code, svgMarkup }) {
  const svgSrc = svgMarkup
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
    : "";

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, mb: 3, backgroundColor: "background.paper" }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-line" }}>
        {description}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Code / input
          </Typography>
          <Box
            component="pre"
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "background.default",
              fontFamily: "monospace",
              fontSize: 12,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            <code>{code}</code>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Example output
          </Typography>
          <Box
            sx={{
              mt: 0.5,
              p: 1.5,
              borderRadius: 1,
              bgcolor: "background.default",
              minHeight: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {svgSrc ? (
              <img
                src={svgSrc}
                alt={title}
                style={{ maxWidth: "100%", maxHeight: 180 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No preview
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

const clockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">
  <rect width="220" height="70" fill="#292929"/>
  <text x="8" y="28" fill="#ccc" font-family="monospace" font-size="12">clk</text>
  <path d="M40 28 H70 V48 H100 V28 H130 V48 H160 V28 H190" fill="none" stroke="#fff" stroke-width="2"/>
</svg>`;

const busSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70">
  <rect width="220" height="70" fill="#292929"/>
  <text x="8" y="28" fill="#ccc" font-family="monospace" font-size="12">data</text>
  <rect x="40" y="20" width="50" height="16" fill="#f0a0b8"/>
  <text x="48" y="32" fill="#111" font-family="monospace" font-size="11">A5</text>
  <rect x="90" y="20" width="50" height="16" fill="#9fd5f5"/>
  <text x="98" y="32" fill="#111" font-family="monospace" font-size="11">3C</text>
</svg>`;

const annotationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="90" viewBox="0 0 240 90">
  <rect width="240" height="90" fill="#292929"/>
  <line x1="60" y1="18" x2="60" y2="55" stroke="#888" stroke-width="1"/>
  <line x1="150" y1="18" x2="150" y2="55" stroke="#888" stroke-width="1"/>
  <line x1="60" y1="18" x2="150" y2="18" stroke="#888" stroke-width="1"/>
  <text x="105" y="14" fill="#bbb" font-family="monospace" font-size="11" text-anchor="middle">t_ACC</text>
  <path d="M40 48 H80 V68 H120" fill="none" stroke="#fff" stroke-width="2"/>
</svg>`;

const breakSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100" viewBox="0 0 240 100">
  <rect width="240" height="100" fill="#292929"/>
  <path d="M40 48 H90" fill="none" stroke="#fff" stroke-width="2"/>
  <path d="M98 35 Q102 48 98 61" fill="none" stroke="#e5e7eb" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M104 35 Q108 48 104 61" fill="none" stroke="#e5e7eb" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M114 48 H180" fill="none" stroke="#fff" stroke-width="2"/>
  <path d="M98 68 Q102 81 98 94" fill="none" stroke="#e5e7eb" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M104 68 Q108 81 104 94" fill="none" stroke="#e5e7eb" stroke-width="1.8" stroke-linecap="round"/>
  <text x="8" y="52" fill="#ccc" font-family="monospace" font-size="11">sig</text>
</svg>`;

export default function UserGuide() {
  const examples = [
    {
      title: "Getting started",
      description:
        "WaveReact edits timing diagrams from JSON-like signal lists in the bottom editor. Each tab stores a waveform array and an annotation array. Use the left toolbar for signal drawing, annotations, and breaks. File → Open/Save stores all tabs as JSON; Save as SVG/PNG exports the visible waveform including annotations and breaks.",
      code: `[
  { name: "clk", wave: "p...." },
  { name: "data", wave: "x.3.5.", data: ["A5", "3C"] }
]`,
      svgMarkup: clockSvg,
    },
    {
      title: "Signal syntax",
      description:
        "Each signal is an object with name and wave string.\n• 1 / 0 — high / low levels\n• p / n — positive / negative clock pulses\n• Bus values use x and a bus key (a–z, =, etc.) with optional data labels\n• . — hold previous value\n• ~ after a space starts a complementary (inverted) copy of the wave",
      code: `{ name: "addr", wave: "x.3.5.2.1.", data: ["A5", "3C", "2F", "1A"] }
{ name: "clk",  wave: "p(.,10)" }`,
      svgMarkup: busSvg,
    },
    {
      title: "Mouse editing (Signal mode)",
      description:
        "Select Signal tools on the left: 1, 0, p, n, bus (B + letter), or eraser. Click or drag on the waveform to paint values. The editor stays in sync with the diagram. Use Format to pretty-print the current tab's signals.",
      code: `Tool: 1 / 0 / p / n / bus / erase
Action: click or drag on waveform rows`,
      svgMarkup: clockSvg,
    },
    {
      title: "Timing annotations",
      description:
        "Switch to Annotation → add (straight) or curve (Bézier). Straight: click three times — start time, end time, then label height. Curve: click three times — first endpoint, second endpoint, then the middle anchor that sets initial curvature.\n\nEdit mode: the middle anchor (circle) and two curvature handles (small dots) appear only in curve edit mode. Select any part and use arrow keys to move it (5 px per step, Shift = 1 px). Dragging a handle changes bend radius; moving the anchor repositions the curve shape. Double-click text to rename, Delete to remove.",
      code: `// Straight
{
  text: "t_ACC",
  start: 2,
  end: 5,
  head: 20,
  foot: 55
}

// Curved (cubic Bézier)
{
  text: "t_DELAY",
  type: "curved",
  x1: 120,
  y1: 40,
  x2: 280,
  y2: 90,
  cx: 200,
  cy: 20,
  h1x: 150,
  h1y: 10,
  h2x: 250,
  h2y: 30
}
}`,
      svgMarkup: annotationSvg,
    },
    {
      title: "Break notation",
      description:
        "Breaks mark a time discontinuity (compressed timeline). Switch to Break → add and click on a signal row at the desired time.\n\n• Per-signal break: click normally — applies to one row\n• Global break: hold Shift while clicking — applies to every signal at that time\n\nIn the annotation editor, breaks use signalIndex, timeStamp, and global (true/false). Use Break → edit to select a break, move it with arrow keys, or delete it.",
      code: `// Per-signal break at time 6 on row 1
{ signalIndex: 1, timeStamp: 6, global: false }

// Global break at time 8 (all rows)
{ signalIndex: 0, timeStamp: 8, global: true }`,
      svgMarkup: breakSvg,
    },
    {
      title: "Tabs and file format",
      description:
        "Each tab has name, waveform, and annotation. Save writes JSON with all tabs. Opening a file replaces the current project. Double-click a tab name to rename it.",
      code: `[
  {
    name: "Reset sequence",
    waveform: [ { name: "clk", wave: "p...." } ],
    annotation: [
      { text: "t_RST", start: 1, end: 3, head: 18, foot: 50 }
    ]
  }
]`,
      svgMarkup: annotationSvg,
    },
    {
      title: "Exporting SVG and PNG",
      description:
        "File → Save as SVG writes the combined diagram: signal names, time ruler, grid, waveforms, annotations, and breaks. Save as PNG rasterizes the same combined SVG. Export always reflects the current tab's visible content.",
      code: `File → Save as SVG
File → Save as PNG`,
      svgMarkup: breakSvg,
    },
    {
      title: "Preferences and display",
      description:
        "Help → Preferences adjusts dx, dy, spacing, and dark/light mode. Dark mode affects the canvas background and export fill color. Help → User guide opens this page in a new tab.",
      code: `Help → Preferences
  dx, dy, offsetY, indentPerLevel, darkMode, …`,
      svgMarkup: clockSvg,
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        WaveReact User Guide
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        WaveReact is a browser-based timing-diagram editor. This guide covers
        signal syntax, annotations, breaks, and export. Open the main app from
        the same site without <code>?userguide=1</code> in the URL.
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Tip: the annotation/break editor and signal editor share the bottom
        panel — the left toolbar switches which array you are editing.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {examples.map((ex, idx) => (
        <GuideExample key={idx} {...ex} />
      ))}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Return to the editor: close this tab or remove <code>?userguide=1</code> from the address bar.
      </Typography>
    </Container>
  );
}
