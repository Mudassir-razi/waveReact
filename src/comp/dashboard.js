
import { useRef, useState, useEffect } from "react";
import NavBar from "./navBar";
import SignalEditor from "./Editor";
import { parse2List, parse2String, checkError } from "../core/parser";
import {manageTabs} from './tabsManager'
import Scrollbar from "./scrollBar";

import {
  Box,
  Container,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider
} from "@mui/material";

import WaveFormWindow from "../core/waveFormWindow";



// Dummy helpers
function tabProps(index) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
    bgcolor : 'primary.main'
  };
}


export default function Dashboard() {
  //Canvas configuration
  const [canvasConfig, setCanvasConfig] = useState({
    dx: 30,
    dy: 22,
    timeStamp: 40,
    signalCount: 5,
    offsetY: 10,
    offsetX: 20,

    //Name div parameter
    indentPerLevel: 30,
    charWidth: 6.5,
    nameStart: 5,
  });


  //Tabs handler starts 
  const [allTabsData, setAllTabsData] = useState([{name : 'New Tab', waveform : []}]);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const handleTabChange = (event, newValue) => {
    //first, store the last tab's data
    setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData));
    setSelectedTabIndex(newValue);
    console.log(newValue);
    editorRef.current.setValue(parse2String(allTabsData[newValue].waveform));
    setCurrentSignalData(allTabsData[newValue].waveform);
  }

  //Buttons handlers
  const handleTabPlus = () =>{setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'add'));}
  const handleTabMinus = () =>{
    const newSelectedTabIndex = selectedTabIndex - 1;
    if(newSelectedTabIndex < 0){ alert("Last tab is sacred");return null;}
    setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'sub'));
    setSelectedTabIndex(newSelectedTabIndex);
    editorRef.current.setValue(parse2String(allTabsData[newSelectedTabIndex].waveform));
    setCurrentSignalData(allTabsData[newSelectedTabIndex].waveform);
  }

  //Update the existing tabs data to accomodate new changes in the editor by user
  // useEffect(() => {
  //   setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'sub', currentSignalData));
  // });
  //Tabs handler ends

  const [currentSignalData, setCurrentSignalData] = useState([]);
  const [hscrollValue, setHscrollValue] = useState(0);

  const [editorHeight, setEditorHeight] = useState(240);
  const isResizing = useRef(false);


  //Editor logic
  const editorRef = useRef(null);
  const handleEditorChange = (value) => {
    try{
      const signalList = parse2List(value);
      checkError(signalList);
      setCurrentSignalData(signalList);
    }catch(err)
    {
      console.log("Code error: ", err);
    }
  }

  const handleFormat = () => {
    try{
      if (editorRef.current) {
        const formatted = parse2String(currentSignalData);
        editorRef.current.setValue(formatted);
      }
    }catch(err)
    {
      alert(err.message);
    }
  }
 
  //Resizable editor logic
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizing.current) return;

      setEditorHeight((h) => {
        const next = h - e.movementY;
        return Math.min(Math.max(next, 120), 500); // clamp
      });
    };

    const onMouseUp = () => {
      isResizing.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);


  return (
    <Container maxWidth={false} disableGutters sx={{ bgcolor: "#1e1e1e", height: "100vh" }}>
      <Stack spacing={0} height="100%">

        {/* Banner */}
        <Box
          sx={{
            height: 72,
            px: 4,
            display: "flex",
            alignItems: "center",
            bgcolor: "#111",
            borderBottom: "1px solid #333",
          }}
        >
          {/* Logo placeholder */}
          <Box
            sx={{
              width: 50,
              height: 50,
              bgcolor: "#444",
              borderRadius: 1,
              mr: 2,
            }}
          >
            <svg viewBox="-5 -5 50 50" width="100%" height="100%">
              <polygon points="15,35 30,5 2,5" fill="#607ad1" />
              <polygon points="25,40 40,10 10,10" fill="#74b2cf8a" />
            </svg>
          </Box>
          <Typography variant="h4" color="white">
            WaveReact
          </Typography>
        </Box>

        {/* Navbar */}
        <Box
          sx={{
            height: 36,
            px: 2,
            display: "flex",
            alignItems: "center",
            bgcolor: "#2b2b2b",
            borderBottom: "1px solid #333",
          }}
        >
          <NavBar title="File" />
          <NavBar title="Edit" />
          <NavBar title="View" />
          <NavBar title="Tools" />
          <NavBar title="Help" />
        </Box>

        {/* Main workspace */}
       <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          height: "100%",
        }}
      >
        {/* LEFT COLUMN — spans top to bottom */}
        <Box
          sx={{
            width: 100,
            bgcolor: "#252526",
            borderRight: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1,
          }}
        >
          {/* Top buttons (SVG-related) */}
          <Stack spacing={1}>
            <Button variant="contained" size="small">1/0</Button>
            <Button variant="outlined" size="small">P/N</Button>
            <Button variant="outlined" size="small">Pen</Button>
            <Divider sx={{ bgcolor: "#444", my: 1 }} />
            <Button variant="text" size="small">Shift</Button>
            <Button variant="text" size="small">Shift</Button>
          </Stack>

          {/* Bottom buttons (Editor-related) */}
          <Stack spacing={1}>
            <Divider sx={{ bgcolor: "#444", my: 1 }} />
            <Button onClick={handleFormat} variant="text" size="small">Format</Button>
            <Button variant="text" size="small">Annotation</Button>
          </Stack>
        </Box>

        {/* RIGHT SIDE — SVG + Editor */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0, // IMPORTANT for Monaco
          }}
        >
          {/* SVG workspace */}
          <Box
            sx={{
              flex: 1,
              bgcolor: "#1f1f1f",
              display: "flex",
              alignItems: "left",
              justifyContent: "left",
              px: 2,
            }}
          >
            <Box>
              <WaveFormWindow 
                signals={currentSignalData}
                config={canvasConfig}
              />
            </Box>
          </Box>
          <Scrollbar onChange={setHscrollValue} value={hscrollValue}/>
          {/* Drag handle */}
          <Box
            sx={{
              height: 6,
              cursor: "row-resize",
              bgcolor: "#333",
              "&:hover": { bgcolor: "#555" },
            }}
            onMouseDown={() => (isResizing.current = true)}
          />

          {/* Monaco editor */}
          <Box
            sx={{
              height: editorHeight,
              borderTop: "1px solid #333",
            }}
          >
            <SignalEditor 
              viewMode={false} 
              editorRef={editorRef}
              onChange={handleEditorChange}
            />
          </Box>
        </Box>
      </Box>


      
      {/* Tabs bar */}
      <Box
        sx={{
          borderTop: "1px solid #333",
          bgcolor: "#1e1e1e",
          display: "flex",
          flexDirection:'row',
          alignItems: "center",
          px: 1,
        }}
      >
        {/* Left button */}
        <Button
          variant="outlined"
          size="small"
          onClick={handleTabMinus}
          sx={{ minWidth: 32, mr: 1 }}
        >
          −
        </Button>

        {/* Tabs */}
        <Tabs
          value={selectedTabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons={true}
          sx={{ "& .MuiTabs-flexContainer": {
          alignItems: "center",
          },}}
        >
          {
            allTabsData.map((tab, i) => (
              <Tab label={tab.name} {...tabProps(i)}/>
            ))
          }
        </Tabs>

        {/* Right button */}
        <Button
          variant="contained"
          size="small"
          onClick={handleTabPlus}
          sx={{ minWidth: 32, ml : 1}}
        >
          +
        </Button>
      </Box>


      </Stack>
    </Container>
  );
}
