import logo from './logo.svg';
import './App.css';
import './comp/button';
import './comp/Editor';
import Grid from './core/grid';
import {useState, useRef, useEffect} from 'react';
import SignalWindow from './core/signal';
import {maxTimeStamp} from './core/signal';
import SignalNameDiv from './comp/signalNameDivl';
import {GetNameSVGWidth} from './comp/signalNameDivl';
import TabBar from './comp/tabBar';
import CollapsibleTab from './comp/CollapsibleTab';
import {combineAndSaveSVG, openJSONFile, saveJSONFile} from './core/fileSys';
import {parse2Json, parse2String, flattenJson, CheckError } from './core/parser';
import ToggleButton from "./comp/toggleButton";
import SignalEditor from './comp/Editor';

function App() {

  //!................................STATES...................................................
  //canvas config
  const [canvasConfig, setCanvasConfig] = useState({

    dx: 30,
    dy: 20,
    timeStamp: 40,
    signalCount: 0,
    offsetY: 10,
    offsetX: 20,
    bgColor: "#000000",
    gridColor: "#FFFFFF"
  });
 
  //tab data
  const [tabs, setTabs] = useState([{ name: "tab 0", signals: [], annotations: [] }]);

  //Signal data
  const [signals, SetSignals] = useState([]);

  //annotationMode data
  const[annotation, setAnnotation] = useState([]);

  //current annotation coordinates
  const[annoCoord, setAnnoCoord] = useState({ text : "time", type : "<-", startX : 0, endX : 0, head : 0, foot : 0, startOffset : 0, endOffset : 0});

  //Flattened signals, for the renderer to use easily.
  //Omits the tree structure and only keeps the signal list.
  const [flatSignals, setFlatSignals] = useState([]);

  //Error parsing
  const [error, setError] = useState(null);

  //selected tab
  const [selectionTab, setSelectionTab] = useState(0);

  //dark mode
  const [viewMode, setViewMode] = useState(1);  //by default 1. light mode

  //annotationMode mode
  const[annotationMode, setAnnotationMode] = useState(0);

  //Fun stuf for tab deletion
  const [delTime, setDelTime] = useState(0);
  //  mouse position
  const [mousePos, setMousePos] = useState([0, 0]);
  const [cursorState, setCursorState] = useState(0);
  const [isDragging, setIsDraggin] = useState(false);
  
  const editorRef = useRef(null);
  const suppressChange = useRef(false);
  
  //!................................ EVENT HANDLERS for BUTTONS ............................................
  //Adds new signal
  const handlerAddbutton = () => {

    //If annotation mode, no signal adding
    if(annotationMode)return;
    var randomSignal = '0.';
    const newItem = { name: 'Signal_' + signals.length, wave: randomSignal, data: '', width: 1, phase : 0 };
    const updatedSignal = [...signals, newItem];
    const updatedFlatSignals = flattenJson(updatedSignal);

    SetSignals(prev => [...prev, newItem]);
    setFlatSignals(updatedFlatSignals);
    editorRef.current.setValue(parse2String(updatedSignal));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(updatedSignal), timeStamp: maxTimeStamp(updatedFlatSignals), signalCount: updatedFlatSignals.length + 1 }));

    //updates tab information
    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { name: tabs[i].name, signals: updatedSignal, annotations: tab.annotations };
      }
      else return tab;
    });
    setTabs(updatedTab);
  };

  //Auto-format code
  const handleCodeFormat = () => {
    try {
      if(annotationMode === 1)return;
      editorRef.current.setValue(parse2String(signals));
      setError(null);
    } catch (e) {
      setError("Failed to format: " + e.message);
    }
  }

  //Open file handler
  const handleOpenFile = () => {
    openJSONFile()
    .then(data => {

      suppressChange.current = true;
      console.log("Loaded JSON:", data);
      setTabs(data);
      setSelectionTab(0);

      const tab0 = data[0];

      SetSignals(tab0.signals);
      setAnnotation(tab0.annotations);

      const flatSignals = flattenJson(tab0.signals);
      setFlatSignals(flatSignals);

      if (editorRef.current) {
        editorRef.current.setValue(parse2String(tab0.signals));
      }
      suppressChange.current = false;
    })
    .catch(err => {
      alert(err.message);
    });
  }

  const handleModeToggle = () => {
    suppressChange.current = true;
    if(annotationMode === 0)editorRef.current.setValue(parse2String(tabs[selectionTab].annotations));
    else editorRef.current.setValue(parse2String(tabs[selectionTab].signals));
    suppressChange.current = false;
    setAnnotationMode(annotationMode === 0 ? 1 : 0);
  }

  //Takes the text editor text input and tries to parse it into JSON object
  const handlerSignalCodeInput = () => {
    if (suppressChange.current) return;
    try {
      if(annotationMode === 0){
        const jsonObj = parse2Json(editorRef.current.getValue()); // convert to JSON array
        const flatSignals = flattenJson(jsonObj); // flatten the JSON array
        //CheckError(flatSignals);
        SetSignals(jsonObj); // Only if valid
        setFlatSignals(flatSignals);
        setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(jsonObj), timeStamp: maxTimeStamp(flatSignals), signalCount: flatSignals.length }));

        //update tab information
        const updatedTab = tabs.map((tab, i) => {
          if (i === selectionTab) {
            return { name: tabs[i].name, signals: jsonObj, annotations: tabs[i].annotations };
          }
          else return tab;
        });
        setTabs(updatedTab);
        setError(null);
      }
      else 
      {
        const jsonObj = parse2Json(editorRef.current.getValue());
        setAnnotation(jsonObj);
        //update tab information
        const updatedTab = tabs.map((tab, i) => {
          if (i === selectionTab) {
            return { name: tab.name, signals: tab.signals, annotations: jsonObj };
          }
          else return tab;
        });
        setTabs(updatedTab);
        setError(null);
      }
    } catch (e) {
      console.log(e.message);
      setError("Invalid format");
    }
  }

  //Save file Handler
  const handleSaveFile = () => {
    saveJSONFile(tabs, "signal.json");
  }

  //Save SVG
  const handleSaveSVG = () => {
    combineAndSaveSVG(document.getElementById("mainLayer"),
      document.getElementById("grid"),
      document.getElementById("nameList"),
      tabs[selectionTab].name,
      viewMode, "svg");
  }

  //Save SVG
  const handleSavePNG = () => {
    combineAndSaveSVG(document.getElementById("mainLayer"),
      document.getElementById("grid"),
      document.getElementById("nameList"),
      tabs[selectionTab].name,
      viewMode,
      "png");
  }

  //tab switching handler
  const handerlTabClick = (e) => {
    //now load new data from next tab
    const flatSignals = flattenJson(tabs[e].signals);
    setSelectionTab(e);
    SetSignals(tabs[e].signals);
    setFlatSignals(flatSignals);
    setAnnotationMode(0);
    setAnnotation(tabs[e].annotations);
    suppressChange.current = true;
    editorRef.current.setValue(parse2String(tabs[e].signals));
    suppressChange.current = false;
    setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(tabs[e].signals), timeStamp: maxTimeStamp(flatSignals), signalCount: flatSignals.length}));
  }

  //Changes the tab name
  const handlerTabNameChange = (index, newName) => {
    setTabs(prevTabs =>
      prevTabs.map((tab, i) =>
        i === index ? { ...tab, name: newName } : tab
      )
    );
  }

  //Adds a new tab
  const handlerAddTab = (e) => {

    const newTab = { name: "tab " + tabs.length, signals: [{ name: 'Signal_' + signals.length, wave: "0..", data: '', width: 1, phase : 0 }], annotations: [] };
    setTabs(prev => [...prev, newTab]);
  }

  const handleTabDelete= (e) => {
    
    //Not at all necessary for the functionality. Just added it for fun
    if (tabs.length <= 1)
    {
      const uDelTime = delTime + 1;
      if(uDelTime >= 10)
      {
        window.alert(phrases[Math.floor(Math.random() * phrases.length)]);
        setDelTime(0);
        return;
      }
      setDelTime(uDelTime);
      return;
    }
    let userConfirmed = window.confirm(`Are you sure you want to delete "${tabs[selectionTab].name}" tab?`);

    if (!userConfirmed) return ;
    

    const updatedTabs = tabs.filter((_, i) => i !== selectionTab);
    const updatedTabIndex = selectionTab - 1 < 0 ? 0 : selectionTab - 1;
    setTabs(updatedTabs);

    //now load new data from next tab
    const flatSignals = flattenJson(updatedTabs[updatedTabIndex].signals);

    SetSignals(updatedTabs[updatedTabIndex].signals);
    setFlatSignals(flatSignals);
    editorRef.current.setValue(parse2String(updatedTabs[updatedTabIndex].signals));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(updatedTabs[updatedTabIndex].signals), timeStamp: maxTimeStamp(flatSignals), signalCount: flatSignals.length}));
    
  }

  //TODO....................../////////////////////////////////////////////////...............
  //
  //Mouse control
  //Handle mouse down on main canvas
  const handlerMouseDownMain = (e) => {
    if(annotationMode === 0)return;
    //getting the first mouse click
    var newMousePos = [0, 0];
    newMousePos[0] = e.x;
    newMousePos[1] = e.y;
    setMousePos(newMousePos);
    if (e.y < canvasConfig.signalCount) setIsDraggin(true);

    if(cursorState === 0)
    {
      const x = Math.round(e.x);
      setCursorState(1);
      setAnnoCoord(prev => ({...prev, startX : x, foot : e.y, startOffset : 0}));
    }

    else if(cursorState === 1)
    {
      const x = Math.round(e.x);
      setCursorState(2);
      setAnnoCoord(prev => ({...prev, endX : x, endOffset : 0}));
    }

    else if (cursorState === 2) {
    const newAnnotation = {...annoCoord, head : e.y};

    // compute updated annotation array first
    const updated = [...annotation, newAnnotation];

    // apply annotation state update
    setAnnotation(updated);

    // reset cursor and coordinates
    setCursorState(0);
    setAnnoCoord({text : "time" , type : "<|", startX : 0, endX : 0, head : 0, foot : 0, startOffset : 0, endOffset : 0});

    // update tabs state
    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { ...tab, annotations: updated };
      }
      return tab;
    });
    if(annotationMode) editorRef.current.setValue(parse2String(updated));
    setTabs(updatedTab);
  }
  };

  const handlerMouseMove = (e) => {
    var newMousePos = [0,0];
    newMousePos[0] = e.x;
    newMousePos[1] = e.y;
    setMousePos(newMousePos);
  }
  //TODO ................................/////////////////////////////////////////....................


  //.................................MAIN HTML RETURN.........................................
  return (
    /* App */
    <div className="App">
      {/* The main container of the app */}
      <div id="container">
        <div id="banner">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>WaveReact</h1>
          <ToggleButton onChange={(v)=>{v === true ? setViewMode(0) : setViewMode(1)}} size="sm" />
          <h2>                .</h2>
        </div>
        {/* The OUTPUT of the app. Signal and it's names */}
        <div id="output-panel"  style={{ background : viewMode ? 'white' : 'black' }}>

          {/* Signal renderer canvas */}
          <div id="canvas-wrapper" style={{ display: 'flex', position: 'relative' }}>

            {/* Fixed signal names column on the left */}
            <SignalNameDiv
              style={{
                position: 'sticky',  // ← important for fixed effect
                top: 0,
                left: 0,
                zIndex: 3,
                background: 'transparent'  // optional: avoid overlap/transparent text
              }}
              signals={signals}
              dy={canvasConfig.dy}
              offsetY={canvasConfig.offsetY}
              viewMode={viewMode}
            />

            {/* Scrollable canvas area */}
            <div
              style={{
                overflow: 'auto',
                width: '100%',
                height: canvasConfig.signalCount * (canvasConfig.dy + canvasConfig.offsetY) +
                  100,
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: canvasConfig.timeStamp * canvasConfig.dx + 100,
                  height: '100%',
                  position: 'relative'
                }}
              >
                <Grid
                  style={{
                    position: 'absolute',
                    top: 0,
                    zIndex: 1
                  }}
                  dx={canvasConfig.dx}
                  dy={canvasConfig.dy}
                  mouse={mousePos}
                  prevMouse={cursorState}
                  dragging={isDragging}
                  offsetX={canvasConfig.offsetX}
                  offsetY={canvasConfig.offsetY}
                  timeStamp={canvasConfig.timeStamp}
                  signalCount={canvasConfig.signalCount}
                  viewMode={viewMode}
                  annotations={annotation}
                  currentCoord={annoCoord}
                  annotationMode={annotationMode}
                  cursorState={cursorState}
                />

                <SignalWindow
                  style={{
                    position: 'absolute',
                    top: 0,
                    zIndex: 2
                  }}
                  signals={flatSignals}
                  dx={canvasConfig.dx}
                  dy={canvasConfig.dy}
                  offsetX={canvasConfig.offsetX}
                  offsetY={canvasConfig.offsetY}
                  timeStamp={canvasConfig.timeStamp}
                  signalCount={canvasConfig.signalCount}
                  onDown={(e) => handlerMouseDownMain(e)}
                  onMove={(e) => handlerMouseMove(e)}
                  onUp={() => console.log("Mouse UP")}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </div>

        </div>

        {/* UI elements holder */}
        <div id="ui-panel"  style={{ background : viewMode ? '#bdbdbd' : '#20242cff'  }}>
          <CollapsibleTab viewMode={viewMode}></CollapsibleTab>
          <div className='control-group'>
            <svg height="20" width="75">
              <rect
                x="0" y="0" height="10" width="75"
                style={error === null ? indicatorGood : indicatorBad}
                strokeWidth="0"
              />
            </svg>
            {/* ==== FILE MENU WRAPPER ==== */}
            <div className="collapsible-menu">
              <button className="button-5 main-menu-btn">File</button>

              <div className="menu-content">
                <button className='button-5' onClick={handleOpenFile}>Open</button>
                <button className='button-5' onClick={handleSaveFile}>Save file</button>
                <button className='button-5' onClick={handleSaveSVG}>Save as SVG</button>
                <button className='button-5' onClick={handleSavePNG}>Save as PNG</button>
              </div>
            </div>
            {/* ============================ */}
            <button className='button-5' onClick={handlerAddbutton}>Add new</button>
            <button className='button-5' onClick={handleCodeFormat}>Auto-format</button>
            <button className='button-5' onClick={handleModeToggle}>Toggle Mode</button>

          </div>

          <div className='control-editor-group'>
            <SignalEditor
              onChange={handlerSignalCodeInput}
              viewMode={viewMode}
              editorRef={editorRef}
            />
          </div>

        </div>
        {/* Tab panel */}
        
        <TabBar tabs={tabs} selectionIndex={selectionTab} onAddDown={handlerAddTab} onSave={handlerTabNameChange} onClick={handerlTabClick} onDelete={handleTabDelete}/>

      </div>
    </div>
  );
}


export default App;

//Helper functions...............................................

const indicatorGood = {
  fill: "teal",
  stroke: "black",
  filter: "drop-shadow(0 0 6px teal)", // bloom glow effect
  transition: "filter 0.3s ease, fill 0.3s ease, stroke 0.3s ease",
};

const indicatorBad = {
  fill: "maroon",
  stroke: "black",
  filter: "drop-shadow(0 0 6px red)",
  transition: "filter 0.3s ease, fill 0.3s ease, stroke 0.3s ease",
};


//Dont delete, if you do, John will come for you
const phrases = [
      "Deleting tabs won’t erase your mistakes.",
      "You can’t fire the last tab… it knows too much.",
      "This tab is the chosen one. It stays.",
      "Careful… you’re about to break the space-time continuum.",
      "Last tab standing — undefeated since forever.",
      "Nice try, but this tab pays the rent.",
      "Remove me and chaos will reign.",
      "What did the last tab ever do to you?",
      "This is not the Jedi delete you’re looking for.",
      "If you delete me, I delete you. Just kidding… or am I?",
      "The prophecy forbids removing the final tab.",
      "Tab lives matter. Especially the last one.",
      "Deleting me will unleash the squirrels.",
      "Last tab? More like the boss level.",
      "End of the line, tab terminator."
];
