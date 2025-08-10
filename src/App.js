import logo from './logo.svg';
import './App.css';
import './comp/button';
import Grid from './core/grid';
import {useState, useRef, useEffect} from 'react';
import SignalWindow from './core/signal';
import {maxTimeStamp} from './core/signal';
import SignalNameDiv from './comp/signalNameDivl';
import {GetNameSVGWidth} from './comp/signalNameDivl';
import TabBar from './comp/tabBar';
import CollapsibleTab from './comp/CollapsibleTab';
import {combineAndSaveSVG, openJSONFile, saveJSONFile} from './core/fileSys';
import {parse2Json, parse2String, flattenJson } from './core/parser';
import ToggleButton from "./comp/toggleButton";

const KEYWORDS = ["name", "data", "wave", "width", "scale"];

function App() {

  //!................................STATES...................................................
  //canvas config
  const [canvasConfig, setCanvasConfig] = useState({

    dx: 30,
    dy: 20,
    timeStamp: 40,
    signalCount: 0,
    offsetY: 8,
    offsetX: 0,
    bgColor: "#000000",
    gridColor: "#FFFFFF"
  });

  //tab data
  const [tabs, setTabs] = useState([{ name: "tab 0", signals: [] }]);

  //Signal data
  const [signals, SetSignals] = useState([]);

  //Flattened signals, for the renderer to use easily.
  //Omits the tree structure and only keeps the signal list.
  const [flatSignals, setFlatSignals] = useState([]);

  //signal text for display
  const [text, setText] = useState(parse2String(signals));

  //Error parsing
  const [error, setError] = useState(null);

  //selected items
  const [selectionIndex, setSelectionIndex] = useState(-1);

  //selected tab
  const [selectionTab, setSelectionTab] = useState(0);

  //dark mode
  const [viewMode, setViewMode] = useState(1);  //by default 1. light mode

  //  mouse position
  const [mousePos, setMousePos] = useState([0, 0]);
  const [prevMousePos, setPrevMousePos] = useState([0, 0]);
  const [isDragging, setIsDraggin] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    editorRef.current.innerHTML = highlightKeywords(editorRef.current.innerText);
  }, []);

  //!................................ EVENT HANDLERS for BUTTONS ............................................
  //Adds new signal
  const handlerAddbutton = () => {
    var randomSignal = '0.';
    const newItem = { name: 'Signal_' + signals.length, wave: randomSignal, data: '', width: 1 };
    const updatedSignal = [...signals, newItem];
    const updatedFlatSignals = flattenJson(updatedSignal);

    SetSignals(prev => [...prev, newItem]);
    setFlatSignals(updatedFlatSignals);
    setText(parse2String(updatedSignal));
    editorRef.current.innerHTML = highlightKeywords(parse2String(updatedSignal));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(updatedSignal), timeStamp: maxTimeStamp(updatedFlatSignals), signalCount: updatedFlatSignals.length + 1 }));

    //updates tab information
    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { name: tabs[i].name, signals: updatedSignal };
      }
      else return tab;
    });
    setTabs(updatedTab);
  };

  //Auto-format code
  const handleCodeFormat = () => {
    try {
      editorRef.current.innerHTML = highlightKeywords(parse2String(signals));
      setError(null);
    } catch (e) {
      setError("Failed to format: " + e.message);
    }
  }

  //Open file handler
  const handleOpenFile = () => {
    openJSONFile()
      .then(data => {
        console.log(data[0]);
        setTabs(data);
        setSelectionTab(0);
        SetSignals(data[0].signals);
        setSelectionIndex(0);
        const flatSignals = flattenJson(data[0].signals);
        setFlatSignals(flatSignals);
        editorRef.current.innerHTML = highlightKeywords(parse2String(data[0].signals));
      })
      .catch(err => {
        alert(err.message);
      });
  }

  //Takes the text editor text input and tries to parse it into JSON object
  const handlerSignalCodeInput = (newText) => {
    try {
      const jsonObj = parse2Json(editorRef.current.innerText); // convert to JSON array
      const flatSignals = flattenJson(jsonObj); // flatten the JSON array
      SetSignals(jsonObj); // Only if valid
      setText(parse2String(signals));
      setFlatSignals(flatSignals);
      setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(jsonObj), timeStamp: maxTimeStamp(flatSignals), signalCount: flatSignals.length }));

      //update tab information
      const updatedTab = tabs.map((tab, i) => {
        if (i === selectionTab) {
          return { name: tabs[i].name, signals: jsonObj };
        }
        else return tab;
      });
      setTabs(updatedTab);

      setError(null);
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
      canvasConfig.offsetX, tabs[selectionTab].name,
      viewMode);
  }

  //tab switching handler
  const handerlTabClick = (e) => {
    //we push current data to the current tab
    //and then load data from the next tab

    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { name: tabs[i].name, signals: signals };
      }
      else return tab;
    });
    setTabs(updatedTab);

    //now load new data from next tab
    const flatSignals = flattenJson(tabs[e].signals);
    setSelectionIndex(0);
    setSelectionTab(e);
    SetSignals(tabs[e].signals);
    setFlatSignals(flatSignals);
    setText(parse2String(tabs[e].signals));
    editorRef.current.innerHTML = highlightKeywords(parse2String(tabs[e].signals));
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

    const newTab = { name: "tab " + tabs.length, signals: [] };
    setSelectionIndex(0);
    setTabs(prev => [...prev, newTab]);
  }

  //TODO....................../////////////////////////////////////////////////...............
  //
  //TODO...........................................DEPCRECATED......................................
  //TODO................................NO MORE MOUSE CONTROL SUPPORT...............................
  //Mouse control
  //Handle mouse down on main canvas
  const handlerMouseDownMain = (e) => {
    console.log("mouse down at " + e.x + " " + e.y);
    //getting the first mouse click
    var newMousePos = [...prevMousePos];
    newMousePos[0] = e.x;
    newMousePos[1] = e.y;
    setPrevMousePos(newMousePos);
    if (e.y < canvasConfig.signalCount) setIsDraggin(true);
  };
  //mouse move
  const handlerMouseMoveMain = (e) => {
    var newMousePos = [...mousePos];
    newMousePos[0] = e.x;
    newMousePos[1] = e.y;
    //we only update if there is a change
    if (newMousePos[0] !== mousePos[0] || newMousePos[1] !== mousePos[1]) setMousePos(newMousePos);
  }
  //mouse up
  const handlerMouseUpMain = (e) => {
    setIsDraggin(false);
    if (e.y >= signals.length) return;
    console.log("Mouse up");
    var updatedSignal = signals[e.y];
    setSelectionIndex(e.y);
    const distance = Math.sqrt(Math.pow(e.x - prevMousePos[0], 2) + Math.pow(e.y - prevMousePos[1], 2));
    //if the distance is close enough, no practical draggin is happening
    if (distance >= 1) {
      const x = e.x;
      const y = e.y;
      const x1 = prevMousePos[0];
      //update signal
      if (y < canvasConfig.signalCount) {
        updatedSignal = signals.map((signal, i) => {
          if (i === y) {

            //strech signal
            if (Math.max(x, x1) > signal.wave.length) {
              let prevwave = signal.wave;
              let sig = signal.wave.split('');
              //sig = sig + sig[sig.length-1].reapeat(x - sig.length);
              return { name: signal.name, wave: prevwave + '.'.repeat(x - sig.length + 1), width: signal.width, data: signal.data };
            }

            //else toggle signal
            else {
              let chars = signal.wave.split('');
              const minx = Math.min(x, x1);
              const maxX = Math.max(x, x1);
              var lastState = 'x';
              i = minx;
              //get the last state
              while (i >= 0) {
                if (chars[i] !== '.') {
                  lastState = chars[i];
                  break;
                }
                i--;
              }

              for (var j = minx + 1; j <= maxX; j++) {
                if (chars[j] !== '.') lastState = chars[j];
                chars[j] = '.';
              }
              if (maxX + 1 < chars.length) chars[maxX + 1] = chars[maxX + 1] === lastState ? '.' : (chars[maxX + 1] === '.' ? lastState : chars[maxX]);
              return { name: signal.name, wave: chars.join(''), width: signal.width, data: signal.data };
            }
          }
          else return signal;
        });
        SetSignals(updatedSignal);
      }
    }
    else {
      const x = e.x;
      const y = e.y;
      //update signal
      if (y < canvasConfig.signalCount) {
        updatedSignal = signals.map((signal, i) => {
          if (i === y) {

            //strech signal
            if (x >= signal.wave.length) {
              let prevwave = signal.wave;
              let sig = signal.wave.split('');
              //sig = sig + sig[sig.length-1].reapeat(x - sig.length);
              return { name: signal.name, wave: prevwave + '.'.repeat(x - sig.length + 1), width: signal.width, data: signal.data };
            }

            //else toggle signal
            else {
              let chars = signal.wave.split('');
              var last = 'x';
              var next = 'x';
              var curr = chars[x];
              i = x - 1;
              //get the last state
              while (i >= 0) {
                if (chars[i] !== '.') {
                  last = chars[i];
                  break;
                }
                i--;
              }
              curr = chars[x] === '.' ? last : chars[x];
              next = x + 1 < chars.length ? (chars[x + 1] === '.' ? curr : chars[x + 1]) : 'x';
              switch (last + curr + next) {
                case '000':
                  chars[x] = '1';
                  chars[x + 1] = '0';
                  break;

                case '001':
                  chars[x] = '1';
                  chars[x + 1] = '.';
                  break;

                case '010':
                  chars[x] = '.';
                  chars[x + 1] = '.';
                  break;

                case '011':
                  chars[x] = '.';
                  chars[x + 1] = '1';
                  break;

                case '100':
                  chars[x] = '.';
                  chars[x + 1] = '0';
                  break;

                case '101':
                  chars[x] = '.';
                  chars[x + 1] = '.';
                  break;

                case '110':
                  chars[x] = '0';
                  chars[x + 1] = '.';
                  break;

                case '111':
                  chars[x] = '0';
                  chars[x + 1] = '1';
                  break;

                default:

                  break;
              }
              return { name: signal.name, wave: chars.join(''), width: signal.width, data: signal.data };
            }
          }
          else return signal;
        });
        SetSignals(updatedSignal);
      }
    }
    setText(parse2String(updatedSignal));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetNameSVGWidth(updatedSignal), timeStamp: maxTimeStamp(updatedSignal)}));

    //update tab
    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { name: tabs[i].name, signals: updatedSignal };
      }
      else return tab;
    });
    setTabs(updatedTab);
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
          <ToggleButton onChange={(v)=>{v === true ? setViewMode(0) : setViewMode(1)}} size="sm" labels={["☀️","🌙"]} />
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
                    left: canvasConfig.offsetX,
                    zIndex: 1
                  }}
                  dx={canvasConfig.dx}
                  dy={canvasConfig.dy}
                  mouse={mousePos}
                  prevMouse={prevMousePos}
                  dragging={isDragging}
                  offsetX={canvasConfig.offsetX}
                  offsetY={canvasConfig.offsetY}
                  timeStamp={canvasConfig.timeStamp}
                  signalCount={canvasConfig.signalCount}
                />

                <SignalWindow
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: canvasConfig.offsetX,
                    zIndex: 2
                  }}
                  signals={flatSignals}
                  dx={canvasConfig.dx}
                  dy={canvasConfig.dy}
                  offsetX={canvasConfig.offsetX}
                  offsetY={canvasConfig.offsetY}
                  timeStamp={canvasConfig.timeStamp}
                  signalCount={canvasConfig.signalCount}
                  onDown={() => console.log("Mouse Down")}
                  onMove={() => console.log("Mouse Move")}
                  onUp={() => console.log("Mouse UP")}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </div>

        </div>

        {/* UI elements holder */}
        <div id="ui-panel"  style={{ background : viewMode ? '#bdbdbd' : '#20242cff'  }}>
          <CollapsibleTab></CollapsibleTab>
          <div className='control-group'>
            <svg height="20" width="75">
              <rect x="0" y="0" height="10" width="75" style={error === null ? indicatorGood : indicatorBad} strokeWidth="0" />
            </svg>
            <button className='button-5' onClick={handlerAddbutton}> Add new </button>
            <button className='button-5' onClick={handleCodeFormat}>Auto-format</button>
            <button className='button-5' onClick={handleSaveFile}>Save file</button>
            <button className='button-5' onClick={handleSaveSVG}>Save SVG</button>
            <button className='button-5' onClick={handleOpenFile}>Open file</button>
          </div>
          <div className='control-editor-group'>
            <div
              ref={editorRef}
              contentEditable
              spellCheck={false}
            
              onInput={handlerSignalCodeInput}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault(); // stop focus change
                  const selection = window.getSelection();
                  const range = selection.getRangeAt(0);

                  // Insert two spaces
                  range.deleteContents();
                  range.insertNode(document.createTextNode("  "));

                  // Move cursor after inserted spaces
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }}
              style={{
                minHeight: "200px",
                padding: "10px",
                border: "1px solid gray",
                fontFamily: "monospace",
                color: viewMode ? "black" : "white",
                whiteSpace: "pre",
                overflow: "auto",
              }}
            ></div>
          </div>

        </div>
        {/* Tab panel */}
        
        <TabBar tabs={tabs} selectionIndex={selectionTab} onAddDown={handlerAddTab} onSave={handlerTabNameChange} onClick={handerlTabClick} />

      </div>
    </div>
  );
}


export default App;

//Helper functions...............................................

 function highlightKeywords(text) {
    // Escape any HTML and apply highlighting
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Replace each keyword with a span
    const pattern = new RegExp(`\\b(${KEYWORDS.join("|")})\\b`, "g");
    return escaped.replace(pattern, `<span class="highlight">$1</span>`);
  }

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
