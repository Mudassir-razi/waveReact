
import { useRef, useState, useEffect } from "react";
import NavBar from "./navBar";
import SignalEditor from "./Editor";
import { parse2List, parse2String, checkError } from "../core/parser";
import {manageTabs} from '../core/tabsManager'
import { modifyOnMouseEvent } from "../core/signalLogic";
import WaveformTools from "./waveformTools";

import {
  Box,
  Container,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
} from "@mui/material";

import WaveFormWindow from "../core/waveFormWindow";


// Tab helpers
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
    //console.log(newValue);
    editorRef.current.setValue(parse2String(allTabsData[newValue].waveform));
    setCurrentSignalData(allTabsData[newValue].waveform);
  }

  //Tab Buttons handlers
  const handleTabPlus = () =>{setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'add'));}
  const handleTabMinus = () =>{
    const newSelectedTabIndex = selectedTabIndex - 1;
    if(newSelectedTabIndex < 0){ alert("Last tab is sacred");return null;}
    setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'sub'));
    setSelectedTabIndex(newSelectedTabIndex);
    editorRef.current.setValue(parse2String(allTabsData[newSelectedTabIndex].waveform));
    setCurrentSignalData(allTabsData[newSelectedTabIndex].waveform);
  }
  //Tabs handler ends..........................................................................................................


  //Waveform Button handler
  const[waveFormButtonSelection, setWaveFormButtonSelection] = useState("10");
  const handleWaveFormButton = (event, newValue) => {
    setWaveFormButtonSelection(newValue);
    //console.log(newValue);
  }


  //Mouse movement control for SVG
  const [mouseDown, setMouseDown] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({x: 0, y: 0});

  const mouseDownSVG  = (e) => {
    setMouseDown(true);
    setLastMousePos({x: e.x, y: e.y});
  }

  const mouseUpSVG = (e) => {

    function transform(c){return {x : Math.floor(c.x/(canvasConfig.dx)), y : Math.floor(c.y/(canvasConfig.dy + canvasConfig.offsetY))};}
    try{
      const clickNow = transform(e);
      const clickLast = transform(lastMousePos);
      const updatedSignal = modifyOnMouseEvent(currentSignalData, clickNow.x, clickNow.y, clickLast.x, clickLast.y, waveFormButtonSelection);
      console.log(updatedSignal);
      editorRef.current.setValue(parse2String(updatedSignal));
      //console.log(waveFormButtonSelection);
    }catch(err)
    {
      console.log("Error in mouseClickSVG: ", err);
    }
  }
  //......................................................................................................................................
  
  const [currentSignalData, setCurrentSignalData] = useState([]);

  const [editorHeight, setEditorHeight] = useState(240);
  const isResizing = useRef(false);
  const svgContainerRef = useRef(null);


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

  //Editor buttons
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

   //Editor adding new signal shortcut buttons
  const handleAddSignal = () => {
    try{
      if (editorRef.current) {
        const updateSignal = [...currentSignalData, {name : 'clock', wave : 'p(.,10)'}];
        editorRef.current.setValue(parse2String(updateSignal));
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
      <Stack spacing={0} sx={{height:"100%"}}>

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
          <NavBar title="View" />
          <NavBar title="Help" />
        </Box>

        {/* Main workspace */}
       <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          height: "100%",
          minHeight:0,
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
        <WaveformTools setParentTool={handleWaveFormButton}/>

          {/* Bottom buttons (Editor-related) */}
          <Stack spacing={1}>
            <Divider sx={{ bgcolor: "#444", my: 1 }} />
            <Button onClick={handleFormat} variant="text" size="small">Format</Button>
            <Button onClick={handleAddSignal} variant="text" size="small">Add new</Button>
          </Stack>
        </Box>

        {/* RIGHT SIDE — SVG + Editor */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0, // IMPORTANT for Monaco
            //alignItems : "center"
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
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <WaveFormWindow
              signals={currentSignalData}
              config={canvasConfig}
              mouseDownSVG={mouseDownSVG}
              mouseUpSVG={mouseUpSVG}
            />
          </Box>
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
              width : "100%",
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
