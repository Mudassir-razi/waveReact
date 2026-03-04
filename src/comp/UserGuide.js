import React from "react";
import { Container, Box, Typography, Paper, Divider } from "@mui/material";

function GuideExample({ title, description, code, svgSrc }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, mb: 3, backgroundColor: "background.paper" }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {description}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Code
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
            }}
          >
            <code>{code}</code>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Output SVG
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
                style={{ maxWidth: "100%", maxHeight: 160 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                SVG preview placeholder
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default function UserGuide() {
  const examples = [
    {
      title: "Getting started",
      description:
        "This is a placeholder section. Replace this text with a short overview of the feature you are describing.",
      code: "// Example waveform or annotation JSON will go here.",
      svgSrc: "",
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        WaveReact User Guide
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This page is a template for documenting how to use the app. For each
        topic, provide a title, a short description, the input code, and an
        example output SVG.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {examples.map((ex, idx) => (
        <GuideExample key={idx} {...ex} />
      ))}
    </Container>
  );
}

