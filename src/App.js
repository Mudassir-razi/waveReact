import logo from './logo.svg';
import './App.css';
import './comp/button';
import Grid from './core/grid';
import { useState, useEffect } from 'react';
import SignalWindow from './core/signal';
import SignalNameDiv from './comp/signalNameDivl';
import TabBar from './comp/tabBar';
import CollapsibleTab from './comp/CollapsibleTab';

function App() {

  //................................STATES...................................................
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
  //signal text for display
  const [text, setText] = useState(signalToLine(signals));
  const [editorText, setEditorText] = useState(signalToLine(signals));

  //Error parsing
  const [error, setError] = useState(null);

  //selected items
  const [selectionIndex, setSelectionIndex] = useState(-1);

  //selected tab
  const [selectionTab, setSelectionTab] = useState(0);

  //mouse position
  const [mousePos, setMousePos] = useState([0, 0]);
  const [prevMousePos, setPrevMousePos] = useState([0, 0]);
  const [isDragging, setIsDraggin] = useState(false);


  useEffect(() => {
    setText(signalToLine(signals));

  }, [signals]);

  useEffect(() => {
    //Keyboard control
    const handleKeyDown = (e) => {

      var updatedSignal = signals;
      //duplicate selected wave.
      if (e.key === 'd' && document.activeElement.tagName.toLowerCase() !== 'textarea') {
        updatedSignal = signals.map((signal, i) => {
          if (i === selectionIndex) {
            var currentWave = signal.wave;
            if (currentWave[0] !== currentWave[currentWave.length - 1] && currentWave[currentWave.length - 1] !== '.') return { name: signal.name, wave: signal.wave + signal.wave, width: signal.width, data: signal.data + ' ' + signal.data };
            else {
              var newWave = '';
              var j = currentWave.length - 1;
              while (j >= 0 && currentWave[j] === '.') j--;

              if (currentWave[0] === currentWave[j]) {
                newWave = '.' + currentWave.substring(1);
                return { name: signal.name, wave: signal.wave + newWave, width: signal.width, data: signal.data + ' ' + signal.data };
              }
              else return { name: signal.name, wave: signal.wave + currentWave, width: signal.width, data: signal.data + ' ' + signal.data };
            }
          }
          else return signal;
        });

        SetSignals(updatedSignal);
        setText(signalToLine(updatedSignal));
        setEditorText(signalToLine(updatedSignal));
        setCanvasConfig(prev => ({ ...prev, offsetX: GetMaxNameLen(updatedSignal), timeStamp: maxTimeStamp(updatedSignal) + 10 }));
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };

  }, [selectionIndex, signals]);

  //................................ EVENT HANDLERS............................................
  //Adds new signal
  const handlerAddbutton = () => {
    var randomSignal = '0.';
    //console.log(randomSignal);
    const newItem = { name: 'Signal_' + signals.length, wave: randomSignal, data: '', width: 1 };
    const updatedSignal = [...signals, newItem];

    SetSignals(prev => [...prev, newItem]);
    setText(signalToLine(updatedSignal));
    setEditorText(signalToLine(updatedSignal));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetMaxNameLen(updatedSignal), timeStamp: maxTimeStamp(updatedSignal) + 10, signalCount: updatedSignal.length + 1 }));

    //updates tab information
    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { name: tabs[i].name, signals: updatedSignal };
      }
      else return tab;
    });
    setTabs(updatedTab);
  };

  const handleCodeFormat = () => {
    console.log("H");
    setEditorText(text);
  }

  const handleOpenFile = () => {
    openJSONFile()
      .then(data => {
        console.log(data[0]);
        setTabs(data);
        setSelectionTab(0);
        SetSignals(data[0].signals);
        setSelectionIndex(0);
        setEditorText(signalToLine(data[0].signals));
      })
      .catch(err => {
        alert(err.message);
      });
  }

  const handleSaveFile = () => {
    saveJSONFile(tabs, "signal.json");
  }

  const handleSaveSVG = () => {
    combineAndSaveSVG(document.getElementById("mainLayer"),
      document.getElementById("grid"),
      document.getElementById("nameList"),
      canvasConfig.offsetX, tabs[selectionTab].name);
  }

  const handlerSignalCodeInput = (newText) => {
    setEditorText(newText); // Update textarea immediately

    try {
      const jsonObj = lineToSignal(newText); // convert to JSON array
      SetSignals(jsonObj); // Only if valid
      setText(signalToLine(signals));
      setCanvasConfig(prev => ({ ...prev, offsetX: GetMaxNameLen(jsonObj), timeStamp: maxTimeStamp(jsonObj) + 10, signalCount: jsonObj.length }));

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
      console.log("Invalid format");
      setError("Invalid format");
    }
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
    setSelectionIndex(0);
    setSelectionTab(e);
    SetSignals(tabs[e].signals);
    setEditorText(signalToLine(tabs[e].signals));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetMaxNameLen(tabs[e].signals), timeStamp: maxTimeStamp(tabs[e].signals) + 10, signalCount: tabs[e].signals.length + 1 }));
  }

  const handlerTabNameChange = (index, newName) => {
    setTabs(prevTabs =>
      prevTabs.map((tab, i) =>
        i === index ? { ...tab, name: newName } : tab
      )
    );
  }

  const handlerAddTab = (e) => {

    const newTab = { name: "tab " + tabs.length, signals: [] };
    setSelectionIndex(0);
    setTabs(prev => [...prev, newTab]);
  }

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
    if (e.y >= signals.length) return;
    if (Object.keys(signals[e.y]).includes('space')) return;
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
    setIsDraggin(false);
    setText(signalToLine(updatedSignal));
    setEditorText(signalToLine(updatedSignal));
    setCanvasConfig(prev => ({ ...prev, offsetX: GetMaxNameLen(updatedSignal), timeStamp: maxTimeStamp(updatedSignal) + 10 }));

    //update tab
    const updatedTab = tabs.map((tab, i) => {
      if (i === selectionTab) {
        return { name: tabs[i].name, signals: updatedSignal };
      }
      else return tab;
    });
    setTabs(updatedTab);
  }

  //.................................MAIN HTML RETURN.........................................
  return (
    /* App */
    <div className="App">
      {/* The main container of the app */}
      <div id="container">
        <div id="banner">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>WaveReact</h1>
        </div>
        {/* The OUTPUT of the app. Signal and it's names */}
        <div id="output-panel">

          {/* Signal renderer canvas */}
          <div id="canvas-wrapper" style={{ display: 'flex', position: 'relative' }}>

            {/* Fixed signal names column on the left */}
            <SignalNameDiv
              style={{
                position: 'sticky',  // ← important for fixed effect
                top: 0,
                left: 0,
                zIndex: 3,
                background: 'white'  // optional: avoid overlap/transparent text
              }}
              signals={signals}
              dy={canvasConfig.dy}
              offsetX={canvasConfig.offsetX}
              offsetY={canvasConfig.offsetY}
              signalCount={canvasConfig.signalCount}
              selectionIndex={selectionIndex}
              Click={(id) => setSelectionIndex(id)}
            />

            {/* Scrollable canvas area */}
            <div
              style={{
                overflow: 'auto',
                width: '100%',
                height:
                  canvasConfig.signalCount * (canvasConfig.dy + canvasConfig.offsetY) +
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
                  signals={signals}
                  dx={canvasConfig.dx}
                  dy={canvasConfig.dy}
                  offsetX={canvasConfig.offsetX}
                  offsetY={canvasConfig.offsetY}
                  timeStamp={canvasConfig.timeStamp}
                  signalCount={canvasConfig.signalCount}
                  onDown={handlerMouseDownMain}
                  onMove={handlerMouseMoveMain}
                  onUp={handlerMouseUpMain}
                />
              </div>
            </div>
          </div>

        </div>

        {/* UI elements holder */}
        <div id="ui-panel">
          <CollapsibleTab></CollapsibleTab>
          <div className='control-group'>
            <svg height="20" width="15">
              <rect x="0" y="0" height="10" width="15" fill={error === null ? "green" : "red"} strokeWidth="1" />
            </svg>
            <button className='button-5' onClick={handlerAddbutton}> Add new </button>
            <button className='button-5' onClick={handleCodeFormat}>Auto-format</button>
            <button className='button-5' onClick={handleSaveFile}>Save file</button>
            <button className='button-5' onClick={handleSaveSVG}>Save SVG</button>
            <button className='button-5' onClick={handleOpenFile}>Open file</button>
          </div>
          <div className='control-group'>
            {(<textarea spellCheck={false} className='textarea' rows={10} cols={98} value={editorText} onChange={(e) => handlerSignalCodeInput(e.target.value)}></textarea>)}
          </div>

        </div>
        {/* Tab panel */}
        
        <TabBar tabs={tabs} selectionIndex={selectionTab} onAddDown={handlerAddTab} onSave={handlerTabNameChange} onClick={handerlTabClick} />

      </div>
    </div>
  );
}


export default App;


// Convert flat line to JSON
function lineToSignal(text) {
  const requiredKeys = ["name", "wave"];
  const lines = text.split("\n");

  return lines.map((line, index) => {
    if (line.trim() === "") return { space: "1" };

    const parts = line.split(",").map(p => p.trim());
    const obj = {};

    for (const part of parts) {
      const [key, ...rest] = part.split(":");
      if (!key || rest.length === 0) {
        throw new Error(`Invalid entry on line ${index + 1}: ${part}`);
      }

      const expression = rest.join(":").trim();

      // Safely evaluate expression (e.g. "abc".repeat(2))
      try {
        const fn = new Function(`return (${expression});`);
        obj[key.trim()] = fn();
      } catch (e) {
        throw new Error(`Line ${index + 1}, key "${key.trim()}": invalid expression → ${expression}`);
      }
    }

    const missing = requiredKeys.filter(k => !(k in obj));
    if (missing.length > 0) {
      throw new Error(`Line ${index + 1}: Missing keys: ${missing.join(", ")}`);
    }

    if ("width" in obj && !isNaN(Number(obj.width))) {
      obj.width = Number(obj.width);
    }

    return obj;
  });
}



// Convert aligned version
function signalToLine(list) {
  const keys = ["name", "wave", "data", "width"];

  // Step 1: determine max lengths of key and value for each key
  const maxKeyLengths = {};
  const maxValueLengths = {};

  for (const key of keys) {
    maxKeyLengths[key] = key.length;
    maxValueLengths[key] = 0;
  }

  for (const item of list) {
    if ('space' in item) continue;

    for (const key of keys) {
      if (key in item) {
        const valueStr = JSON.stringify(item[key]);
        maxValueLengths[key] = Math.max(maxValueLengths[key], valueStr.length);
      }
    }
  }

  // Step 2: format each line with aligned key: value
  return list.map(signal => {
    if ('space' in signal) return "";

    const line = keys
      .filter(key => key in signal)
      .map(key => {
        const paddedKey = key.padEnd(maxKeyLengths[key]);
        const valueStr = JSON.stringify(signal[key]).padEnd(maxValueLengths[key]);
        return `${paddedKey} : ${valueStr}`;
      })
      .join(",  ");

    return line;
  }).join("\n");
}



function maxTimeStamp(signals) {
  var maxLen = 0;
  signals.forEach(element => {
    const len = !Object.keys(element).includes('space') ? element.wave.length : 0;
    maxLen = len > maxLen ? len : maxLen;
  });

  return maxLen;
}

//returns the maximum length 
function GetMaxNameLen(signals) {
  var maxNameLen = 0;
  signals.forEach(element => {
    if (Object.keys(element).includes("name")) {
      const len = element.name.length;
      maxNameLen = len > maxNameLen ? len : maxNameLen;
    }
  });
  return maxNameLen * 9 + 22;
}

function saveJSONFile(data, filename = "data.json") {
  const json = JSON.stringify(data, null, 2); // pretty-print with 2-space indent
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url); // cleanup
}

function openJSONFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        resolve(json);
      } catch (err) {
        reject(new Error("Invalid JSON file"));
      } finally {
        document.body.removeChild(input);
      }
    };

    input.onerror = () => {
      reject(new Error("File input error"));
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

function combineAndSaveSVG(signalSvg, gridSvg, nameSvg, filename = 'combined.svg') {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Extract widths and height
  const nameWidth = parseFloat(nameSvg.getAttribute('width') || 0);
  const signalWidth = parseFloat(signalSvg.getAttribute('width') || 0);
  const gridHeight = parseFloat(gridSvg.getAttribute('height') || 0);
  const totalWidth = nameWidth + signalWidth;

  // Create a combined SVG
  const combinedSVG = document.createElementNS(SVG_NS, 'svg');
  combinedSVG.setAttribute('xmlns', SVG_NS);
  combinedSVG.setAttribute('width', totalWidth);
  combinedSVG.setAttribute('height', gridHeight);
  combinedSVG.setAttribute('viewBox', `0 0 ${totalWidth} ${gridHeight}`);

  // Helper: clone and translate group
  function cloneGroup(sourceSvg, offsetX = 0) {
    const g = document.createElementNS(SVG_NS, 'g');

    if (offsetX !== 0) {
      g.setAttribute('transform', `translate(${offsetX}, 0)`);
    }

    // Copy children
    Array.from(sourceSvg.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        g.appendChild(node.cloneNode(true));
      }
    });

    return g;
  }

  // Step 1: grid (shifted right)
  const gridGroup = cloneGroup(gridSvg, nameWidth);
  removeSvgChildrenById(gridGroup, ['selectionRect', 'selectionLine1', 'selectionLine2']);
  // Step 2: signal (shifted right)
  const signalGroup = cloneGroup(signalSvg, nameWidth);

  // Step 3: name (at x = 0)
  const nameGroup = cloneGroup(nameSvg, 0);
  nameGroup.setAttribute("font-family", "monospace");
  nameGroup.setAttribute("font-weight", "bold");

  // Append layers in back-to-front order
  combinedSVG.appendChild(gridGroup);   // back
  combinedSVG.appendChild(signalGroup); // middle
  combinedSVG.appendChild(nameGroup);   // front


  // Serialize and download
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(combinedSVG);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function removeSvgChildrenById(svgElement, idsToRemove) {
  idsToRemove.forEach(id => {
    const element = svgElement.querySelector(`#${id}`);
    if (element) {
      element.remove(); // Remove the element from the DOM
    }
  });
}