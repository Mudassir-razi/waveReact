import { Slider, Box } from "@mui/material";

export default function ScrollBar({
  value,
  onChange,
  thumbSize = 2,   // % of track
}) {
  return (
    <Box
      sx={{
        width: "100%",
        px: 1,
      }}
    >
      <Slider
        value={value}
        min={0}
        max={100}
        onChange={(_, v) => onChange(v)}
        sx={{
          height: 12,
          color: "transparent",

          "& .MuiSlider-track": {
            display: "none",
          },

          "& .MuiSlider-rail": {
            height: 6,
            borderRadius: 3,
            backgroundColor: "#ddd",
          },

          "& .MuiSlider-thumb": {
            width: `${thumbSize}%`,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#555",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          },
        }}
      />
    </Box>
  );
}
