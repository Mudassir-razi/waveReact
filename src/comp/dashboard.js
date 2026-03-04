
import { useRef, useState, useEffect } from "react";
import NavBar from "./navBar";
import SignalEditor from "./Editor";
import { parse2List, parse2String, checkError } from "../core/parser";
import { manageTabs } from "../core/tabsManager";
import { modifyOnMouseEvent } from "../core/signalLogic";
import WaveformTools from "./waveformTools";
import { getSVG } from "../core/waveFormWindow";
import { openJSONFile, saveJSONFile } from "../core/fileSys";
import { useAppConfig } from "../core/config";
import PrefMenu from "./prefMenu";

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

let dontChangeEditor = false;

export default function Dashboard() {

  const config = useAppConfig().config;

  //Tab stuff..............................................................................................................
  //Tabs handler starts 
  const [allTabsData, setAllTabsData] = useState([{name : 'New Tab', waveform : [], annotation : []}]);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  //Tab name editers 
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempName, setTempName] = useState("");

  const handleStartEdit = (index, currentName) => {
    setEditingIndex(index);
    setTempName(currentName);
  };

  const handleSaveEdit = (index) => {
    const updatedTabs = [...allTabsData];
    updatedTabs[index].name = tempName;
    setAllTabsData(updatedTabs);
    setEditingIndex(null);
  };

  //Changing tab on Click 
  const handleTabChange = (event, newValue) => {
    //first, store the last tab's data
    setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData, currentAnnotationData));
    setSelectedTabIndex(newValue);
    //console.log(newValue);
    editorRef.current.setValue(parse2String(allTabsData[newValue].waveform));
    setCurrentSignalData(allTabsData[newValue].waveform);
    setCurrentAnnotationData(allTabsData[newValue].annotation);
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


  //Waveform / annotation tool handlers
  const [waveFormButtonSelection, setWaveFormButtonSelection] = useState("10");
  const [annotationTool, setAnnotationTool] = useState("add"); // 'add' | 'edit'

  const handleWaveFormButton = (event, newValue) => {
    setWaveFormButtonSelection(newValue);
    setDashboardMode("signal");
    dontChangeEditor = true;
    editorRef.current.setValue(parse2String(currentSignalData));
  };

  const handleAnnotationToolChange = (mode) => {
    setAnnotationTool(mode);
    setDashboardMode("annotation");
    setAnnoState(0);
    dontChangeEditor = true;
    editorRef.current.setValue(parse2String(currentAnnotationData));
  };


  //Mouse movement control for SVG
  const [mouseDown, setMouseDown] = useState(false);
  const [annoState, setAnnoState] = useState(0);
  const [lastMousePos, setLastMousePos] = useState({x: 0, y: 0});

  //annotation mouse position
  const [annoStart, setAnnoStart] = useState(0);
  const [annoEnd, setAnnoEnd] = useState(0);
  const [annoFoot, setAnnoFoot] = useState(0);



  const mouseDownSVG  = (e) => {
    setMouseDown(true);
    setLastMousePos({x: e.x, y: e.y});
  }

  const mouseUpSVG = (e) => {

    function transform(c){return {x : Math.floor(c.x/(config.dx)), y : Math.floor(c.y/(config.dy + config.offsetY))};}
    try{
      const clickNow = transform(e);
      const clickLast = transform(lastMousePos);
      if(dashboardMode === "signal"){
        const updatedSignal = modifyOnMouseEvent(currentSignalData, clickNow.x, clickNow.y, clickLast.x, clickLast.y, waveFormButtonSelection);
        console.log(updatedSignal);
        editorRef.current.setValue(parse2String(updatedSignal));
      }
      else if(dashboardMode === "annotation"){
        if(annotationTool !== "add"){
          return;
        }
        //Annotation modification logic will be here
        if(annoState === 0){
          setAnnoStart(clickNow.x);
          setAnnoFoot(e.y);
          setAnnoState(1);
        }
        else if(annoState === 1){
          setAnnoEnd(clickNow.x);
          setAnnoState(2);
          //console.log("New annotation: ", {text : "new annotation", start : annoStart, end : clickNow.x, head : annoHead, foot : clickNow.y});
        }
        else if(annoState === 2){
          setAnnoState(0);
          const newAnnotation = {text : "new annotation", start : annoStart, end : annoEnd, head : e.y, foot : annoFoot};
          const updatedAnnotation = [...currentAnnotationData, newAnnotation];
          editorRef.current.setValue(parse2String(updatedAnnotation));
          //console.log("New annotation: ", newAnnotation);
        }
      }
      //console.log(waveFormButtonSelection);
    }catch(err)
    {
      console.log("Error in mouseClickSVG: ", err);
    }
  }
  //......................................................................................................................................
  
  const [currentSignalData, setCurrentSignalData] = useState([]);
  const [currentAnnotationData, setCurrentAnnotationData] = useState([]);
  const [dashboardMode, setDashboardMode] = useState("signal"); //signal or annotation

  const [editorHeight, setEditorHeight] = useState(240);
  const isResizing = useRef(false);
  const svgContainerRef = useRef(null);


  //Editor logic
  const editorRef = useRef(null);
  const handleEditorChange = (value) => {
    try{
      if(dontChangeEditor){dontChangeEditor=false; return null;}
      if(dashboardMode === "signal"){
        const signalList = parse2List(value);
        checkError(signalList);
        setCurrentSignalData(signalList);
      }
      else if(dashboardMode === "annotation"){
        const annotationList = parse2List(value);
        setCurrentAnnotationData(annotationList);
      }
    }catch(err)
    {
      console.log("Code error: ", err);
    }
  }

  //Editor buttons
  const handleFormat = () => {
    try{
      if (editorRef.current && dashboardMode === "signal") {
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
      if (editorRef.current && dashboardMode === "signal") {
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
  

  //Navbar handlers
  const handleNewFile = () =>
  {
    setAllTabsData([{name : 'New Tab', waveform : []}]);
    setSelectedTabIndex(0);
    editorRef.current.setValue("");
    setCurrentSignalData([]);
  }
  const handleOpenFile = () =>
  {
    // const proceed = window.confirm("Opening a file will replace the current data. Do you want to continue?");
    // if(~proceed){return null;}

    try{
      openJSONFile().then((data) => {
        setAllTabsData(data);
        editorRef.current.setValue(parse2String(data[0].waveform));
        setCurrentSignalData(data[0].waveform);
      });
    }catch(err)
    {alert(err);}
  }
  const handleSaveFile = () =>
  {
    try{
    const allTabsUpdatedData = manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData);
    saveJSONFile(allTabsUpdatedData);
    }catch(err)
    {alert(err);}
  }

  const handleSaveSVG = () =>
  {
    try{
      const combinedSvg = getSVG();

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(combinedSvg);

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      //SVG part
      const link = document.createElement("a");
      link.href = url;
      link.download = "filename.svg";
      link.click();
      
    }catch(err)
    {
      alert(err);
    }
  }

  const handleSavePng = () => {
    try{
    const combinedSvg = getSVG();
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(combinedSvg);
    
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = function(){
      const canvas = document.createElement("canvas");
      canvas.width = combinedSvg.getAttribute("width");
      canvas.height = combinedSvg.getAttribute("height");
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `newFile.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, "image/png");

      URL.revokeObjectURL(url);
    }
    img.src = url;
  }catch(err)
    {
      alert(err);
    }
  }

  const handleMode2Signal = () => {dontChangeEditor=true;setDashboardMode("signal"); editorRef.current.setValue(parse2String(currentSignalData));}
  const handleMode2Annotation = () => {dontChangeEditor=true;setDashboardMode("annotation");setAnnoState(0);editorRef.current.setValue(parse2String(currentAnnotationData));}

  const [prefOpen, setPrefOpen] = useState(false);
  const handleOpenPreferences = () => setPrefOpen(true);
  const handleClosePreferences = () => setPrefOpen(false);

  const handleOpenUserGuide = () => {
    const { origin, pathname } = window.location;
    const url = `${origin}${pathname}?userguide=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAnnotationUpdate = (idx, newAnnotation) => {
    setCurrentAnnotationData((prev) => {
      const next = prev.map((ann, i) => (i === idx ? newAnnotation : ann));
      if (dashboardMode === "annotation") {
        dontChangeEditor = true;
        editorRef.current.setValue(parse2String(next));
      }
      return next;
    });
  };

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
          <NavBar title="File"
            items={[{label : "New", onClick : handleNewFile},
                    {label : "Open ", onClick : handleOpenFile},
                    {label : "Save ", onClick : handleSaveFile},
                    {label : "Save as SVG", onClick : handleSaveSVG},
                    {label : "Save as PNG", onClick : handleSavePng}
            ]}
          />
          <NavBar
            title="Help"
            items={[
              { label: "Preferences", onClick: handleOpenPreferences },
              { label: "User guide", onClick: handleOpenUserGuide },
            ]}
          />
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
        <WaveformTools
          setParentTool={handleWaveFormButton}
          onAnnotationToolChange={handleAnnotationToolChange}
        />

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
              anno={currentAnnotationData}
              mode={dashboardMode}
              state={annoState}
              
              start={annoStart}
              end={annoEnd}
              foot={annoFoot}

              mouseDownSVG={mouseDownSVG}
              mouseUpSVG={mouseUpSVG}
              annotationMode={annotationTool}
              onAnnotationUpdate={handleAnnotationUpdate}
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
          scrollButtons
        >
          {allTabsData.map((tab, i) => (
            <Tab
              key={i}
              {...tabProps(i)}
              label={
                editingIndex === i ? (
                  <input
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleSaveEdit(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(i);
                      if (e.key === "Escape") setEditingIndex(null);
                    }}
                    style={{
                      width: "100px",
                      fontSize: "inherit",
                      textAlign: "center"
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleStartEdit(i, tab.name)}
                  >
                    {tab.name}
                  </span>
                )
              }
            />
          ))}
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
      <PrefMenu open={prefOpen} onClose={handleClosePreferences} />
      </Stack>
    </Container>
  );
}
