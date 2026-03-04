import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAppConfig, DEFAULT_CONFIG } from "../core/config";

const MAX_VALUES = {
  dx: 200,
  dy: 200,
  timeStamp: 500,
  signalCount: 128,
  offsetY: 100,
  offsetX: 200,
  indentPerLevel: 200,
  rulerHeight: 100,
  charWidth: 30,
  nameStart: 100,
};

export default function PrefMenu({ open, onClose }) {
  const { config, updateConfig } = useAppConfig();
  const [draft, setDraft] = useState(config);

  useEffect(() => {
    if (open) {
      setDraft(config);
    }
  }, [open, config]);

  const handleAdjust = (key, delta) => {
    const max = MAX_VALUES[key] ?? 500;
    const current = Number(draft[key]) || 0;
    const next = Math.min(max, Math.max(0, current + delta));
    setDraft((prev) => ({ ...prev, [key]: next }));
  };

  const handleToggleDarkMode = () => {
    setDraft((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleRestoreDefaults = () => {
    setDraft(DEFAULT_CONFIG);
  };

  const handleApply = () => {
    updateConfig(draft);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const numericKeys = Object.keys(DEFAULT_CONFIG).filter(
    (k) => k !== "darkMode"
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", pr: 6 }}>
        Preferences
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {numericKeys.map((key) => (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" sx={{ mr: 2 }}>
                {key}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAdjust(key, -1)}
                >
                  -
                </Button>
                <Box
                  sx={{
                    minWidth: 48,
                    textAlign: "center",
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontFamily: "monospace",
                  }}
                >
                  {draft[key]}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleAdjust(key, 1)}
                >
                  +
                </Button>
              </Box>
            </Box>
          ))}

          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2">darkMode</Typography>
            <Button
              variant={draft.darkMode ? "contained" : "outlined"}
              size="small"
              onClick={handleToggleDarkMode}
            >
              {draft.darkMode ? "On" : "Off"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleRestoreDefaults}>Restore default</Button>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleApply}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

