import logo from './logo.svg';
import './App.css';
import './comp/button';
import Grid from './core/grid';
import { useState, useEffect} from 'react';
import SignalWindow from './core/signal';
import SignalNameDiv from './comp/signalNameDivl';
import TabBar from './comp/tabBar';

function App() {

  //................................STATES...................................................
  //canvas config
  const [canvasConfig, setCanvasConfig] = useState({
    
    dx: 30,
    dy: 30,
    timeStamp: 40,
    signalCount: 0,
    offsetY: 8,
    bgColor: "#000000",
    gridColor: "#FFFFFF"
  
  });
  
  //tab data
  const[tabs, setTabs] = useState([{name : "tab 0", signals : []}]);

  //Signal data
  const [signals, SetSignals] = useState([]);
  //signal text for display
  const [text, setText] = useState(signalToLine(signals));
  const [editorText, setEditorText] = useState(signalToLine(signals));

  //Error parsing
  const [error, setError] = useState(null);

  //tab render sequence
  const [tabRenderSequence, setTabRenderSequence] = useState([0]);

  //selected items
  const [selectionIndex, setSelectionIndex] = useState(-1);

  //selected tab
  const[selectionTab, setSelectionTab] = useState(0);

  //mouse position
  const[mousePos, setMousePos] = useState([0,0]);
  const[prevMousePos, setPrevMousePos] = useState([0,0]);
  const[isDragging, setIsDraggin] = useState(false);
  
  // useEffect(() => {
  //   setText(signalToLine(signals));
    
  // }, [signals]);

  useEffect(()=> 
  {
    //Keyboard control
    const handleKeyDown = (e) =>
    {
      var updatedSignal = signals;
      //duplicate selected wave.
      if(e.key === 'd' && document.activeElement.tagName.toLowerCase() !== 'textarea')
      {
        updatedSignal = signals.map((signal, i) => { 
          if(i === selectionIndex)
          {
            var currentWave = signal.wave;
            if(currentWave[0] !== currentWave[currentWave.length-1] && currentWave[currentWave.length-1] !== '.')return {name : signal.name, wave : signal.wave + signal.wave, width : signal.width, data : signal.data + ' ' + signal.data};
            else 
            {
              var newWave = '';
              var j = currentWave.length-1;
              while(j >= 0 && currentWave[j] === '.') j--;
              
              if(currentWave[0] === currentWave[j]) 
              {
                newWave = '.' + currentWave.substring(1);
                return {name : signal.name, wave : signal.wave + newWave, width : signal.width, data : signal.data +  ' ' + signal.data};
              }
              else return {name : signal.name, wave : signal.wave + currentWave, width : signal.width, data : signal.data +  ' ' + signal.data};
            }
          }
          else return signal;
        });
        SetSignals(updatedSignal);
        setText(signalToLine(updatedSignal));
        setEditorText(signalToLine(updatedSignal));
        setCanvasConfig(prev => ({...prev,timeStamp: maxTimeStamp(updatedSignal) + 10 }));
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };


  }, []);

  //................................ EVENT HANDLERS............................................
  //Adds new signal
  const handlerAddbutton = () => {
    var randomSignal = '0.';
    //console.log(randomSignal);
    const newItem = {name : 'Signal_' + signals.length , wave : randomSignal, data : '', width : 1};
    const updatedSignal = [...signals, newItem];

    SetSignals(prev => [...prev, newItem]);
    setText(signalToLine(updatedSignal));
    setEditorText(signalToLine(updatedSignal));
    setCanvasConfig(prev => ({...prev,timeStamp: maxTimeStamp(updatedSignal) + 10, signalCount : updatedSignal.length + 1}));
  };

  const handleCodeFormat = () => {
    console.log("H");
    setEditorText(text);
  }

  const handlerSignalCodeInput = (newText) =>
  {
    setEditorText(newText); // Update textarea immediately

    try {
      const jsonObj = lineToSignal(newText); // convert to JSON array
      SetSignals(jsonObj); // Only if valid
      setText(signalToLine(signals));
      setCanvasConfig(prev => ({...prev,timeStamp: maxTimeStamp(jsonObj) + 10, signalCount : jsonObj.length + 1}));
      setError(null);
    } catch (e) {
      console.log("Invalid format");
      setError("Invalid format");
    }
  }

  //tab switching handler
  const handerlTabClick = (e) =>
  {
    //we push current data to the current tab
    //and then load data from the next tab

    const updatedTab = tabs.map((tab, i) => {
      if(i === selectionTab){
        return {name : tabs[i].name, signals : signals};
      }
      else return tab;
    });
    setTabs(updatedTab);

    //now load new data from next tab
    setSelectionIndex(0);
    setSelectionTab(e);
    SetSignals(tabs[e].signals);
    setEditorText(signalToLine(tabs[e].signals));
    setCanvasConfig(prev => ({...prev,timeStamp: maxTimeStamp(tabs[e].signals) + 10, signalCount : tabs[e].signals.length + 1}));
  }

  const handlerAddTab = (e) => {
    console.log(tabRenderSequence);
    const newTab = {name : "tab " + tabs.length, signals : []};
    setSelectionIndex(0);
    setTabs(prev => [...prev, newTab]);
    setTabRenderSequence(prev => [...prev, tabs.length]);
  }

  //Mouse control
  //Handle mouse down on main canvas
  const handlerMouseDownMain = (e) =>
  {
    console.log("mouse down at " + e.x + " " + e.y);
    //getting the first mouse click
    var newMousePos = [...prevMousePos];
    newMousePos[0] = e.x;
    newMousePos[1] = e.y;
    setPrevMousePos(newMousePos);
    setIsDraggin(true);
  };

  //mouse move
  const handlerMouseMoveMain = (e) =>
  {
    var newMousePos = [...mousePos];
    newMousePos[0] = e.x;
    newMousePos[1] = e.y;
    //we only update if there is a change
    if(newMousePos[0] !== mousePos[0] || newMousePos[1] !== mousePos[1])setMousePos(newMousePos);
  }


  //mouse up
  const handlerMouseUpMain = (e) =>
  {
    if(e.y >= signals.length)return;
    if (Object.keys(signals[e.y]).includes('space'))return;
    var updatedSignal = signals[e.y];
    setSelectionIndex(e.y); 
    const distance = Math.sqrt(Math.pow(e.x - prevMousePos[0], 2) + Math.pow(e.y - prevMousePos[1], 2));
    //if the distance is close enough, no practical draggin is happening
    if(distance >= 1)
    {
      const x = e.x;
      const y = e.y;
      const x1 = prevMousePos[0];
      //update signal
      if(y < canvasConfig.signalCount){
        updatedSignal = signals.map((signal, i) => {
          if(i === y){
            
            //strech signal
            if(Math.max(x, x1) > signal.wave.length)
            {
              let prevwave = signal.wave;
              let sig = signal.wave.split('');
              //sig = sig + sig[sig.length-1].reapeat(x - sig.length);
              return {name : signal.name, wave : prevwave + '.'.repeat(x-sig.length+1), width : signal.width, data : signal.data};
            }

            //else toggle signal
            else 
            {
              let chars = signal.wave.split('');
              const minx = Math.min(x ,x1);
              const maxX = Math.max(x, x1);
              var lastState = 'x';
              i = minx;
              //get the last state
              while(i >= 0)
              {
                if(chars[i] !== '.')
                {
                  lastState = chars[i];
                  break;
                }
                i--;
              }

              for(var j = minx+1; j <= maxX;j++){
                if(chars[j] !== '.')lastState = chars[j];
                chars[j] = '.';
              }
              if(maxX+1 < chars.length)chars[maxX+1] = chars[maxX+1] === lastState ? '.' : (chars[maxX+1] === '.' ? lastState : chars[maxX]) ;
              return {name : signal.name, wave : chars.join(''), width : signal.width, data : signal.data};
            }
          }
          else return signal;
        });
        SetSignals(updatedSignal);
      }
    }
    else 
    {
      const x = e.x;
      const y = e.y;
      //update signal
      if(y < canvasConfig.signalCount){
        updatedSignal = signals.map((signal, i) => {
          if(i === y){
            
            //strech signal
            if(x >= signal.wave.length)
            {
              let prevwave = signal.wave;
              let sig = signal.wave.split('');
              //sig = sig + sig[sig.length-1].reapeat(x - sig.length);
              return {name : signal.name, wave : prevwave + '.'.repeat(x-sig.length+1), width : signal.width, data : signal.data};
            }

            //else toggle signal
            else
            {
              let chars = signal.wave.split('');
              var last = 'x';
              var next = 'x';
              var curr = chars[x];
              i = x-1;
              //get the last state
              while(i >= 0)
              {
                if(chars[i] !== '.')
                {
                  last = chars[i];
                  break;
                }
                i--;
              }
              curr = chars[x] === '.' ? last : chars[x];
              next = x+1 < chars.length ? (chars[x+1] === '.' ? curr : chars[x+1]): 'x';
              switch (last + curr + next)
              {
                case '000' : 
                  chars[x] = '1';
                  chars[x+1] = '0';
                  break;

                case '001' : 
                  chars[x] = '1';
                  chars[x+1] = '.';
                  break;

                case '010' : 
                  chars[x] = '.';
                  chars[x+1] = '.';
                  break;

                case '011' : 
                  chars[x] = '.';
                  chars[x+1] = '1';
                  break;

                case '100' : 
                  chars[x] = '.';
                  chars[x+1] = '0';
                  break;

                case '101' : 
                  chars[x] = '.';
                  chars[x+1] = '.';
                  break;

                case '110' : 
                  chars[x] = '0';
                  chars[x+1] = '.';
                  break;

                case '111' : 
                  chars[x] = '0';
                  chars[x+1] = '1';
                  break;

                default :
                  
                  break;
              }
              return {name : signal.name, wave : chars.join(''), width : signal.width, data : signal.data};
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
    setCanvasConfig(prev => ({...prev,timeStamp: maxTimeStamp(updatedSignal) + 10 }));
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

          {/* Signal names div*/}
          <SignalNameDiv signals={signals} selectionIndex={selectionIndex} Click={(id) => {setSelectionIndex(id)}} onAddButton={handlerAddbutton}/>

          {/* Signal renderer canvas */}
          <div id="canvas-wrapper">
            <div style={{ width: canvasConfig.timeStamp * canvasConfig.dx, height: canvasConfig.signalCount * (canvasConfig.dy + canvasConfig.offsetY) + 100, position: 'relative' }}>
              <Grid
                style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} 
                dx={canvasConfig.dx} dy={canvasConfig.dy} mouse={mousePos} prevMouse={prevMousePos} dragging={isDragging} offsetY={canvasConfig.offsetY}timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount}
              />
              <SignalWindow
                style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
                signals={signals} dx={canvasConfig.dx} dy={canvasConfig.dy} offsetY={canvasConfig.offsetY} timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount} onDown={handlerMouseDownMain} onMove={(e) => {handlerMouseMoveMain(e)}} onUp={(e) => {handlerMouseUpMain(e)}}
              />
            </div>
          </div>
        </div>
        
        {/* UI elements holder */}
        <div id="ui-panel">
          <svg height="50" width="18">
            <rect x="10" y="20" height="10" width="15" fill={error === null ? "black" : "red"}  strokeWidth="1"/>
          </svg>
          <div className='control-group'>
            {(<textarea spellCheck={false} className='textarea' rows={10} cols={100} value={editorText} onChange={(e) => handlerSignalCodeInput(e.target.value)}></textarea>)}
            <button className='button-5' onClick={handleCodeFormat}>Auto-format</button>
          </div>
        </div>
        {/* Tab panel */}
        <TabBar tabs={tabs} renderSequence={tabRenderSequence} selectionIndex={selectionTab} onAddDown={handlerAddTab} onClick={handerlTabClick}/>

      </div>
    </div>
  );
}


export default App;


// Convert flat line to JSON
function lineToSignal(text) {
  const requiredKeys = ["name", "wave", "data", "width"];
  const lines = text.split("\n"); // Don't trim globally – preserve blank lines

  return lines.map((line, index) => {
    if (line.trim() === "") {
      return { space: "1" };
    }

    const parts = line.trim().split(/\s{2,}/); // split by 2+ spaces
    const obj = {};

    for (const part of parts) {
      const [key, ...rest] = part.split(":");
      if (!key || rest.length === 0) throw new Error(`Invalid part: ${part}`);
      obj[key.trim()] = rest.join(":").trim();
    }

    // Validate keys
    const objKeys = Object.keys(obj);
    const missingKeys = requiredKeys.filter(k => !(k in obj));
    const extraKeys = objKeys.filter(k => !requiredKeys.includes(k));

    if (missingKeys.length > 0) {
      throw new Error(`Line ${index + 1}: Missing keys: ${missingKeys.join(", ")}`);
    }
    if (extraKeys.length > 0) {
      throw new Error(`Line ${index + 1}: Unexpected keys: ${extraKeys.join(", ")}`);
    }

    // Optionally cast width to number
    if (!isNaN(Number(obj.width))) {
      obj.width = Number(obj.width);
    }

    return obj;
  });
}




// Convert aligned version
function signalToLine(list) {
  const keys = ["name", "wave", "data", "width"];
  const maxKeyLengths = {};

  // Calculate max lengths only for signal entries (ignore space-only entries)
  for (const key of keys) {
    maxKeyLengths[key] = Math.max(
      ...list
        .filter(item => item[key] !== undefined)
        .map(s => `${key}: ${s[key]}`.length)
    );
  }

  return list
    .map(signal => {
      if ('space' in signal) {
        const numSpaces = parseInt(signal.space, 10) || 1;
        return '\n'.repeat(numSpaces); // one or more empty lines
      }

      return keys
        .map(key => {
          const value = signal[key] ?? "";
          const field = `${key}: ${value}`;
          return field.padEnd(maxKeyLengths[key] + 4); // 4 spaces after each field
        })
        .join("");
    })
    .join("\n");
}

function maxTimeStamp(signals)
{
  var maxLen = 0;
  signals.forEach(element => {
    const len = !Object.keys(element).includes('space') ? element.wave.length : 0;
    maxLen = len > maxLen ? len : maxLen;
  });

  return maxLen;
}
