import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material";
import { useState, useMemo } from "react";
import { getBuses } from "../core/signal";
import { useAppConfig } from "../core/config";

const getBtnStyle = (darkMode) => ({
  minWidth: 32,
  height: 28,
  padding: 0,
  fontSize: 13,
  fontFamily: "monospace",
  color: darkMode ? "#bbb" : "#333",
  borderColor: darkMode ? "#333" : "#cbd5e1",

  "&.Mui-selected": {
    bgcolor: darkMode ? "#444" : "#dbeafe",
    color: darkMode ? "#fff" : "#111827",
    borderColor: darkMode ? "#666" : "#93c5fd",
  },
});

export default function WaveformTools({
  setParentTool,
  onAnnotationToolChange,
  onBreakToolChange,
}) {
  const { config } = useAppConfig();
  const darkMode = config.darkMode ?? true;
  const BTN = getBtnStyle(darkMode);

  const busOptions = useMemo(() => {
    const buses = getBuses();
    return Object.keys(buses);
  }, []);

  const initialBus = busOptions.includes("r") ? "r" : busOptions[0];

  const [tool, setTool] = useState("1");
  const [bus, setBus] = useState(initialBus);

  const onChangeButton = (event, value) => {
    if (!value) return;
    setTool(value);
    if (value.startsWith("annotation:")) {
      if (onAnnotationToolChange) onAnnotationToolChange(value.split(":")[1]);
      return;
    }
    if (value.startsWith("break:")) {
      if (onBreakToolChange) onBreakToolChange(value.split(":")[1]);
      return;
    }
    setParentTool(event, value);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Divider sx={{ flex: 1, bgcolor: darkMode ? "#444" : "#cbd5e1" }} />
        <Typography variant="caption" sx={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
          Signal
        </Typography>
        <Divider sx={{ flex: 1, bgcolor: darkMode ? "#444" : "#cbd5e1" }} />
      </Box>
      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={onChangeButton}
        sx={{
          width: "100%",
          border: `1px solid ${darkMode ? "#222" : "#cbd5e1"}`,
          p: 0.5,
          bgcolor: darkMode ? "#1a1a1a" : "#f8fafc",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            width: "100%",
          }}
        >
          {/* 1 / 0 */}
          <ToggleButton value="1" sx={BTN}>1</ToggleButton>
          <ToggleButton value="0" sx={BTN}>0</ToggleButton>

          {/* p / n */}
          <ToggleButton value="p" sx={BTN}>p</ToggleButton>
          <ToggleButton value="n" sx={BTN}>n</ToggleButton>

          {/* Bus */}
          <Box sx={{ display: "flex", gridColumn: "span 2", minWidth: 0 }}>
            <ToggleButton value={bus} sx={{ ...BTN, flexShrink: 0 }}>
              B
            </ToggleButton>

            <Select
              size="small"
              value={bus}
              onChange={(e) => {
                const next = e.target.value;
                setBus(next);
                setTool(next);
                setParentTool(e, next);
              }}
              IconComponent={() => null}
              sx={{
                ml: "4px",
                flex: 1,
                minWidth: 0,
                height: 28,
                color: darkMode ? "#bbb" : "#333",
                bgcolor: darkMode ? "#111" : "#fff",

                "& .MuiSelect-select": {
                  py: 0,
                  px: 1,
                  fontSize: 12,
                },

                "& fieldset": { borderColor: darkMode ? "#333" : "#cbd5e1" },
              }}
            >
              {busOptions.map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Eraser */}
          <ToggleButton value="erase" sx={{ ...BTN, gridColumn: "span 2" }}>
            eraser
          </ToggleButton>
        </Box>
      </ToggleButtonGroup>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1 }}>
        <Divider sx={{ flex: 1, bgcolor: darkMode ? "#444" : "#cbd5e1" }} />
        <Typography variant="caption" sx={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
          Annotation
        </Typography>
        <Divider sx={{ flex: 1, bgcolor: darkMode ? "#444" : "#cbd5e1" }} />
      </Box>

      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={onChangeButton}
        sx={{
          width: "100%",
          border: `1px solid ${darkMode ? "#222" : "#cbd5e1"}`,
          p: 0.5,
          bgcolor: darkMode ? "#1a1a1a" : "#f8fafc",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            width: "100%",
          }}
        >
          <ToggleButton value="annotation:add" sx={BTN}>
            add
          </ToggleButton>
          <ToggleButton value="annotation:curve" sx={BTN}>
            curve
          </ToggleButton>
          <ToggleButton value="annotation:edit" sx={{ ...BTN, gridColumn: "span 2" }}>
            edit
          </ToggleButton>
        </Box>
      </ToggleButtonGroup>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1 }}>
        <Divider sx={{ flex: 1, bgcolor: darkMode ? "#444" : "#cbd5e1" }} />
        <Typography variant="caption" sx={{ color: darkMode ? "#9ca3af" : "#6b7280" }}>
          Break
        </Typography>
        <Divider sx={{ flex: 1, bgcolor: darkMode ? "#444" : "#cbd5e1" }} />
      </Box>

      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={onChangeButton}
        sx={{
          width: "100%",
          border: `1px solid ${darkMode ? "#222" : "#cbd5e1"}`,
          p: 0.5,
          bgcolor: darkMode ? "#1a1a1a" : "#f8fafc",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            width: "100%",
          }}
        >
          <ToggleButton value="break:add" sx={BTN}>
            add
          </ToggleButton>
          <ToggleButton value="break:edit" sx={BTN}>
            edit
          </ToggleButton>
        </Box>
      </ToggleButtonGroup>
    </Box>
  );
}
