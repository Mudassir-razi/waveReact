import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem
} from "@mui/material";
import { useState } from "react";

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

export default function WaveformTools({setParentTool}) {
  const [tool, setTool] = useState("1");
  const [bus, setBus] = useState(8);
  const onChangeButton = (event, value) => {
    setTool(value);
    setParentTool(event, value);
  }
  return (
    <ToggleButtonGroup
      value={tool}
      exclusive
      onChange={(_, v) => v && onChangeButton(_, v)}
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
          <ToggleButton value="bus" sx={{ ...BTN, flexShrink: 0 }}>
            b
          </ToggleButton>

          <Select
            size="small"
            value={bus}
            onChange={(e) => {
              setBus(e.target.value);
              setTool("bus");
            }}
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
            {[1,2,4,8,16,32].map(v =>
              <MenuItem key={v} value={v}>{v}</MenuItem>
            )}
          </Select>
        </Box>

        {/* Eraser */}
        <ToggleButton value="erase" sx={{ ...BTN, gridColumn: "span 2" }}>
          eraser
        </ToggleButton>
      </Box>
    </ToggleButtonGroup>
  );
}
