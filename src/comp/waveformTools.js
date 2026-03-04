import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import { useState, useMemo } from "react";
import { getBuses } from "../core/signal";

const BTN = {
  minWidth: 32,
  height: 28,
  padding: 0,
  fontSize: 13,
  fontFamily: "monospace",
  color: "#bbb",
  borderColor: "#333",

  "&.Mui-selected": {
    bgcolor: "#444",
    color: "#fff",
    borderColor: "#666",
  },
};

export default function WaveformTools({ setParentTool, onAnnotationToolChange }) {
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
    if (value === "add" || value === "edit") {
      if (onAnnotationToolChange) onAnnotationToolChange(value);
      return;
    }
    setParentTool(event, value);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={onChangeButton}
        sx={{
          width: "100%",
          border: "1px solid #222",
          p: 0.5,
          bgcolor: "#1a1a1a",
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
                color: "#bbb",
                bgcolor: "#111",

                "& .MuiSelect-select": {
                  py: 0,
                  px: 1,
                  fontSize: 12,
                },

                "& fieldset": { borderColor: "#333" },
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

      <Divider sx={{ bgcolor: "#444", my: 1 }} />

      <ToggleButtonGroup
        value={tool}
        exclusive
        onChange={onChangeButton}
        sx={{
          width: "100%",
          border: "1px solid #222",
          p: 0.5,
          bgcolor: "#1a1a1a",
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
          <ToggleButton value="add" sx={BTN}>
            add
          </ToggleButton>
          <ToggleButton value="edit" sx={BTN}>
            edit
          </ToggleButton>
        </Box>
      </ToggleButtonGroup>
    </Box>
  );
}
