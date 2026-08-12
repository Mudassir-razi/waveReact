
import { useRef, useState, useEffect } from "react";
import NavBar from "./navBar";
import SignalEditor from "./Editor";
import { parse2List, parse2String, checkError } from "../core/parser";
import { manageTabs } from "../core/tabsManager";
import { modifyOnMouseEvent } from "../core/signalLogic";
import WaveformTools from "./waveformTools";
import { getSVG, getSVGString } from "../core/waveFormWindow";
import { serializeSvg } from "../core/svgOptimizer";
import { openJSONFile, saveJSONFile } from "../core/fileSys";
import { useAppConfig, isDarkMode } from "../core/config";
import PrefMenu from "./prefMenu";
import DiagramErrorBoundary from "./DiagramErrorBoundary";

import { createCurveHandles } from "../core/curvedAnnotation";
import {
  Box,
  Container,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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
  const darkMode = isDarkMode(config);

  //Tab stuff..............................................................................................................
  //Tabs handler starts 
  const [allTabsData, setAllTabsData] = useState([{name : 'New Tab', waveform : [], annotation : []}]);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [tabDeleteUndoStack, setTabDeleteUndoStack] = useState([]);

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

  // The editor holds whichever list the active tool edits, so a tab has to be
  // loaded through here: handing annotation mode a waveform makes the next
  // keystroke parse it and overwrite that tab's annotations.
  const loadTabIntoEditor = (tab) => {
    const waveform = tab?.waveform || [];
    const annotation = tab?.annotation || [];

    setCurrentSignalData(waveform);
    setCurrentAnnotationData(annotation);

    if (editorRef.current) {
      dontChangeEditor = true;
      editorRef.current.setValue(
        parse2String(dashboardMode === "signal" ? waveform : annotation)
      );
    }
  };

  //Changing tab on Click 
  const handleTabChange = (event, newValue) => {
    //first, store the last tab's data
    const savedTabs = manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData, currentAnnotationData);
    setAllTabsData(savedTabs);
    setSelectedTabIndex(newValue);
    loadTabIntoEditor(savedTabs[newValue]);
  }

  //Tab Buttons handlers
  const handleTabPlus = () =>{setAllTabsData(manageTabs(allTabsData, selectedTabIndex, 'add'));}
  const handleTabMinus = () =>{
    const newSelectedTabIndex = selectedTabIndex - 1;
    if(newSelectedTabIndex < 0){ alert("Last tab is sacred");return null;}

    const tabsWithCurrent = manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData, currentAnnotationData);
    const deletedTab = structuredClone(tabsWithCurrent[selectedTabIndex]);

    setTabDeleteUndoStack((prev) => [
      ...prev,
      { tab: deletedTab, index: selectedTabIndex },
    ]);

    const newTabs = manageTabs(tabsWithCurrent, selectedTabIndex, 'sub');
    setAllTabsData(newTabs);
    setSelectedTabIndex(newSelectedTabIndex);
    loadTabIntoEditor(newTabs[newSelectedTabIndex]);
  }

  const handleUndoTabDelete = () => {
    if (tabDeleteUndoStack.length === 0) {
      alert("Nothing to undo.");
      return;
    }

    const tabsWithCurrent = manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData, currentAnnotationData);
    const { tab, index } = tabDeleteUndoStack[tabDeleteUndoStack.length - 1];
    const restoredTabs = [...tabsWithCurrent];
    restoredTabs.splice(index, 0, structuredClone(tab));

    setAllTabsData(restoredTabs);
    setSelectedTabIndex(index);
    loadTabIntoEditor(restoredTabs[index]);
    setTabDeleteUndoStack((prev) => prev.slice(0, -1));
  };
  //Tabs handler ends..........................................................................................................


  //Waveform / annotation tool handlers
  const [waveFormButtonSelection, setWaveFormButtonSelection] = useState("1");
  const [annotationTool, setAnnotationTool] = useState("add"); // 'add' | 'curve' | 'edit'
  const [breakTool, setBreakTool] = useState("add"); // 'add' | 'edit'

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

  const handleBreakToolChange = (mode) => {
    setBreakTool(mode);
    setDashboardMode("break");
    setAnnoState(0);
    dontChangeEditor = true;
    editorRef.current.setValue(parse2String(currentAnnotationData));
  };


  //Mouse movement control for SVG
  const [, setMouseDown] = useState(false);
  const [annoState, setAnnoState] = useState(0);
  const [lastMousePos, setLastMousePos] = useState({x: 0, y: 0});

  //annotation mouse position
  const [annoStart, setAnnoStart] = useState(0);
  const [annoEnd, setAnnoEnd] = useState(0);
  const [annoFoot, setAnnoFoot] = useState(0);
  const [curveP1, setCurveP1] = useState(null);
  const [curveP2, setCurveP2] = useState(null);



  const getSvgPoint = (event) => {
    const svg = event.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const mouseDownSVG  = (event) => {
    const e = getSvgPoint(event);
    setMouseDown(true);
    setLastMousePos({x: e.x, y: e.y});
  }

  const mouseUpSVG = (event) => {
    const e = getSvgPoint(event);

    function transform(c){return {x : Math.floor(c.x/(config.dx)), y : Math.floor(c.y/(config.dy + config.offsetY))};}
    try{
      const clickNow = transform(e);
      const clickLast = transform(lastMousePos);
      if(dashboardMode === "signal"){
        const updatedSignal = modifyOnMouseEvent(currentSignalData, clickNow.x, clickNow.y, clickLast.x, clickLast.y, waveFormButtonSelection);
        editorRef.current.setValue(parse2String(updatedSignal));
      }
      else if(dashboardMode === "annotation"){
        if(annotationTool === "curve"){
          if(annoState === 0){
            setCurveP1({ x: e.x, y: e.y });
            setCurveP2(null);
            setAnnoState(1);
          } else if(annoState === 1 && curveP1){
            setCurveP2({ x: e.x, y: e.y });
            setAnnoState(2);
          } else if(annoState === 2 && curveP1 && curveP2){
            setAnnoState(0);
            const anchorX = e.x;
            const anchorY = e.y;
            const handles = createCurveHandles(
              curveP1.x,
              curveP1.y,
              curveP2.x,
              curveP2.y,
              anchorX,
              anchorY
            );
            const newAnnotation = {
              type: "curved",
              text: "new annotation",
              x1: curveP1.x,
              y1: curveP1.y,
              x2: curveP2.x,
              y2: curveP2.y,
              cx: anchorX,
              cy: anchorY,
              ...handles,
            };
            setCurveP1(null);
            setCurveP2(null);
            const updatedAnnotation = [...currentAnnotationData, newAnnotation];
            editorRef.current.setValue(parse2String(updatedAnnotation));
          }
          return;
        }

        if(annotationTool !== "add"){
          return;
        }
        if(annoState === 0){
          setAnnoStart(clickNow.x);
          setAnnoFoot(e.y);
          setAnnoState(1);
        }
        else if(annoState === 1){
          setAnnoEnd(clickNow.x);
          setAnnoState(2);
        }
        else if(annoState === 2){
          setAnnoState(0);
          const newAnnotation = {
            text : "new annotation",
            start : annoStart,
            end : annoEnd,
            head : e.y,
            foot : annoFoot,
          };
          const updatedAnnotation = [...currentAnnotationData, newAnnotation];
          editorRef.current.setValue(parse2String(updatedAnnotation));
        }
      }
      else if(dashboardMode === "break"){
        if(breakTool !== "add"){
          return;
        }

        const signalIndex = Math.max(0, clickNow.y);
        const timeStamp = Math.max(0, Math.round((e.x / config.dx) * 10) / 10);
        const isGlobal = event.shiftKey;
        const newBreak = { signalIndex: isGlobal ? 0 : signalIndex, timeStamp, global: isGlobal };
        const updatedAnnotation = [...currentAnnotationData, newBreak];
        editorRef.current.setValue(parse2String(updatedAnnotation));
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
  const [dashboardMode, setDashboardMode] = useState("signal"); //signal | annotation | break

  // Cancel in-progress annotation placement with Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (dashboardMode !== "annotation") return;
      if (annotationTool !== "add" && annotationTool !== "curve") return;
      if (annoState === 0) return;
      setAnnoState(0);
      setCurveP1(null);
      setCurveP2(null);
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dashboardMode, annotationTool, annoState]);

  const [editorHeight, setEditorHeight] = useState(240);
  const isResizing = useRef(false);


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
      else if(dashboardMode === "annotation" || dashboardMode === "break"){
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
    setAllTabsData([{name : 'New Tab', waveform : [], annotation : []}]);
    setSelectedTabIndex(0);
    setTabDeleteUndoStack([]);
    dontChangeEditor = true;
    editorRef.current.setValue("");
    setCurrentSignalData([]);
    setCurrentAnnotationData([]);
  }
  const handleOpenFile = () =>
  {
    // const proceed = window.confirm("Opening a file will replace the current data. Do you want to continue?");
    // if(~proceed){return null;}

    openJSONFile()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("This file does not contain any tabs.");
        }

        const normalized = data.map((tab, i) => ({
          name: typeof tab?.name === "string" ? tab.name : `Tab ${i + 1}`,
          waveform: Array.isArray(tab?.waveform) ? tab.waveform : [],
          annotation: Array.isArray(tab?.annotation) ? tab.annotation : [],
        }));

        // A file can be hand edited or written by an older version, and an
        // invalid waveform would otherwise only surface as a failed render.
        normalized.forEach((tab, i) => {
          try {
            if (tab.waveform.length > 0) checkError(tab.waveform);
          } catch (err) {
            throw new Error(`Tab ${i + 1} ("${tab.name}"): ${err.message}`);
          }
        });

        setAllTabsData(normalized);
        // The old selection can point past the end of the file just opened.
        setSelectedTabIndex(0);
        setTabDeleteUndoStack([]);
        loadTabIntoEditor(normalized[0]);
      })
      .catch((err) => {
        if (err?.message === "No file selected") return;
        alert(err?.message || err);
      });
  }
  const handleSaveFile = () =>
  {
    try{
    const allTabsUpdatedData = manageTabs(allTabsData, selectedTabIndex, 'mod', currentSignalData, currentAnnotationData);
    setAllTabsData(allTabsUpdatedData);
    saveJSONFile(allTabsUpdatedData);
    }catch(err)
    {alert(err);}
  }

  const handleSaveSVG = () =>
  {
    try{
      const svgString = getSVGString();
      if (!svgString) {
        alert("Waveform is not ready to export yet.");
        return;
      }

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
    if (!combinedSvg) {
      alert("Waveform is not ready to export yet.");
      return;
    }
    const svgString = serializeSvg(combinedSvg);

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

  const handleCopySvg = async () => {
    try {
      const svgString = getSVGString();
      if (!svgString) {
        alert("Waveform is not ready to copy yet.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(svgString);
        return;
      }

      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = svgString;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (err) {
      alert(err?.message || err);
    }
  };

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
      if (dashboardMode === "annotation" || dashboardMode === "break") {
        dontChangeEditor = true;
        editorRef.current.setValue(parse2String(next));
      }
      return next;
    });
  };

  const handleBreakUpdate = (idx, newBreak) => {
    setCurrentAnnotationData((prev) => {
      const next = prev.map((item, i) => (i === idx ? newBreak : item));
      if (dashboardMode === "annotation" || dashboardMode === "break") {
        dontChangeEditor = true;
        editorRef.current.setValue(parse2String(next));
      }
      return next;
    });
  };

  const handleBreakDelete = (idx) => {
    setCurrentAnnotationData((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (dashboardMode === "annotation" || dashboardMode === "break") {
        dontChangeEditor = true;
        editorRef.current.setValue(parse2String(next));
      }
      return next;
    });
  };

  const handleAnnotationDelete = handleBreakDelete;

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ bgcolor: darkMode ? "#1e1e1e" : "#f3f4f6", height: "100vh" }}
    >
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
          <Typography variant="h4" color="white" sx={{ flex: 1 }}>
            WaveReact
          </Typography>
          <IconButton
            aria-label="Copy waveform image"
            title="Copy waveform image"
            onClick={handleCopySvg}
            sx={{ color: "#e5e7eb" }}
          >
            <ContentCopyIcon />
          </IconButton>
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
            title="Edit"
            items={[
              {
                label: "Undo",
                onClick: handleUndoTabDelete,
                disabled: tabDeleteUndoStack.length === 0,
              },
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
            bgcolor: darkMode ? "#252526" : "#f9fafb",
            borderRight: `1px solid ${darkMode ? "#333" : "#d1d5db"}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1,
          }}
        >
        <WaveformTools
          setParentTool={handleWaveFormButton}
          onAnnotationToolChange={handleAnnotationToolChange}
          onBreakToolChange={handleBreakToolChange}
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
              bgcolor: darkMode ? "transparent" : "#ffffff" ,
              display: "flex",
              alignItems: "left",
              justifyContent: "left",
              px: 2,
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <DiagramErrorBoundary resetKey={currentSignalData}>
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
              curveP1={annotationTool === "curve" && annoState >= 1 ? curveP1 : null}
              curveP2={annotationTool === "curve" && annoState >= 2 ? curveP2 : null}
              breakMode={breakTool}
              onAnnotationUpdate={handleAnnotationUpdate}
              onAnnotationDelete={handleAnnotationDelete}
              onBreakUpdate={handleBreakUpdate}
              onBreakDelete={handleBreakDelete}
            />
            </DiagramErrorBoundary>
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
