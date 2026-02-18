import { Box } from "@mui/material";
import { useEffect, useRef } from "react";

export default function TestApp() {
  const nameDivWidth = 120;
  const rulerHeight = 50;
  const signalWindowHeight = 1200;
  const signalWindowWidth = 3000;

  const scrollRef = useRef(null);
  const rulerRef = useRef(null);
  const namesRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;

    const handleScroll = () => {
      const { scrollTop, scrollLeft } = node;

      rulerRef.current.style.transform =
        `translateX(${-scrollLeft}px)`;

      namesRef.current.style.transform =
        `translateY(${-scrollTop}px)`;
    };

    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        bgcolor: "black"
      }}
    >
      {/* LEFT NAME PANEL */}
      <Box
        sx={{
          width: nameDivWidth,
          height: "100%",         
          overflow: "hidden",
          position: "relative",
          flexShrink: 0
        }}
      >
        <svg
          ref={namesRef}
          width={nameDivWidth}
          height={signalWindowHeight}
          style={{ display: "block" }}  
        >
          <rect
            width={nameDivWidth}
            height={signalWindowHeight}
            fill="#6c819c"
          />
          <rect x={0} y={0} height={30} width={30} fill="black"></rect>
        </svg>
      </Box>

      {/* RIGHT SIDE */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          minWidth:0,
          flexDirection: "column",
          height: "100%"   
        }}
      >
        {/* RULER */}
        <Box
          sx={{
            height: rulerHeight,
            overflow: "hidden",
            position: "relative",
            flexShrink: 0
          }}
        >
          <svg
            ref={rulerRef}
            width={signalWindowWidth}
            height={rulerHeight}
            style={{ display: "block" }}
          >
            <rect
              width={signalWindowWidth}
              height={rulerHeight}
              fill="#9289a3"
            />
            <rect x={0} y={0} height={30} width={30} fill="black"></rect>
          </svg>
        </Box>

        {/* MAIN SCROLL OWNER */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflow: "auto",
            minHeight: 0  
          }}
        >
          <svg
            width={signalWindowWidth}
            height={signalWindowHeight}
            style={{ display: "block" }}
          >
            <rect
              width={signalWindowWidth}
              height={signalWindowHeight}
              fill="#535255"
            />
            <rect x={0} y={0} height={30} width={30} fill="black"></rect>
            <rect x={500} y={100} width={50} height={50} fill="#958aaa" />
          </svg>
        </Box>
      </Box>
    </Box>
  );
}
