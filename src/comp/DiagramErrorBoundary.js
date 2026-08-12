import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Keeps a diagram that fails to render from taking the editor down with it.
 *
 * A throw anywhere in the waveform tree would otherwise unmount the whole app
 * and leave the user staring at a blank page with their source gone, so the
 * canvas is fenced off and the message is shown in its place. Editing the
 * source changes `resetKey`, which clears the error and tries the render again.
 */
export default class DiagramErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    console.error("Diagram render failed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box sx={{ p: 3, maxWidth: 640 }}>
        <Typography variant="subtitle2" gutterBottom>
          This diagram could not be drawn
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
          {this.state.error.message}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          Your source is untouched. Edit it below and the diagram will redraw.
        </Typography>
      </Box>
    );
  }
}
