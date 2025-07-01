import logo from './logo.svg';
import './App.css';
import './comp/button';
import Grid from './core/grid';
import { useState } from 'react';
import Slider from './comp/slider';
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
  const[tabs, setTabs] = useState([{name : "tab 0", signals : [], renderSequence : []}]);

  //Signal data
  const [signals, SetSignals] = useState([]);

  //render sequence
  const [renderSequence, setRenderSequence] = useState([]);
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
  


  //................................ EVENT HANDLERS............................................
  //Adds new signal
  const handlerAddbutton = () => {
    var randomSignal = '0.';
    //console.log(randomSignal);
    const newItem = {name : 'Signal_' + signals.length , wave : randomSignal, data : '', width : 1}
    SetSignals(prev => [...prev, newItem]);
    setCanvasConfig(prev => ({...prev, signalCount : canvasConfig.signalCount + 1}));
    setRenderSequence(prev => [...prev, signals.length]);
  };

  const handlerSignalNameInput = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : e.target.value, wave : signal.wave, width : signal.width, data : signal.data};
      }
      else return signal;
    });

    SetSignals(updatedSignal);
  }

  const handlerWaveInput = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : signal.name, wave : e.target.value, width : signal.width, data : signal.data};
      }
      else return signal;
    });
    SetSignals(updatedSignal);
  }

  const handlerDataInput = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : signal.name, wave : signal.wave, width : signal.width, data : e.target.value};
      }
      else return signal;
    });
    SetSignals(updatedSignal);
  }

  const handlerSignalWidthSlider = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : signal.name, wave : signal.wave, width : e, data:signal.data};
      }
      else return signal;
    });

    SetSignals(updatedSignal);
  }

  //tab switching handler
  const handerlTabClick = (e) =>
  {
    //we push current data to the current tab
    //and then load data from the next tab

    const updatedTab = tabs.map((tab, i) => {
      if(i === selectionTab){
        return {name : tabs[i].name, signals : signals, renderSequence : renderSequence};
      }
      else return tab;
    });
    setTabs(updatedTab);

    //now load new data from next tab
    setSelectionIndex(0);
    setSelectionTab(e);
    SetSignals(tabs[e].signals);
    setRenderSequence(tabs[e].renderSequence);
  }

  const handlerAddTab = (e) => {
    console.log(tabRenderSequence);
    const newTab = {name : "tab " + tabs.length, signals : [], renderSequence : []};
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
    const distance = Math.sqrt(Math.pow(e.x - prevMousePos[0], 2) + Math.pow(e.y - prevMousePos[1], 2));
    //if the distance is close enough, no practical draggin is happening
    if(distance >= 2)
    {
      const x = e.x;
      const x1 = prevMousePos[0];
      const y = renderSequence.indexOf(prevMousePos[1]);
      const copyBit = signals[y].wave[x1];
      //update signal
      if(y < canvasConfig.signalCount){
        const updatedSignal = signals.map((signal, i) => {
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
      const y = renderSequence.indexOf(e.y);
      //update signal
      if(y < canvasConfig.signalCount){
        const updatedSignal = signals.map((signal, i) => {
          if(i === y){
            
            //strech signal
            if(x > signal.wave.length)
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
  }

  //Keyboard control
  const handleKeyDown = (e) =>
  {
    const currentRenderIndex = renderSequence.indexOf(selectionIndex);
    console.log("Selected id " + selectionIndex + " render index " + currentRenderIndex); 
    //Move up
    if(e === 'ArrowUp' && currentRenderIndex >= 1)
    {
      console.log("Moving up " + currentRenderIndex);
      var newSequence = [...renderSequence];
      var temp = renderSequence[currentRenderIndex];
      newSequence[currentRenderIndex] = newSequence[currentRenderIndex-1];
      newSequence[currentRenderIndex-1] = temp;
      setRenderSequence(newSequence);
      setSelectionIndex(selectionIndex);
      console.log("Moved up ", newSequence);
    }

    //Move up
    else if(e === 'ArrowDown' && currentRenderIndex < signals.length-1)
    {
      console.log("Moving Down " + currentRenderIndex);
      newSequence = [...renderSequence];
      temp = renderSequence[currentRenderIndex];
      newSequence[currentRenderIndex] = newSequence[currentRenderIndex+1];
      newSequence[currentRenderIndex+1] = temp;
      setRenderSequence(newSequence);
      setSelectionIndex(selectionIndex);
      console.log("Moved Down ", newSequence);
    }
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
          <svg width = "100" height="200">
            <circle cx="50" cy="50" r="5" stroke="red" fill="black"  strokeWidth="2"  />
          </svg>
        </div>
        {/* The OUTPUT of the app. Signal and it's names */}
        <div id="output-panel">

          {/* Signal names div*/}
          <SignalNameDiv signals={signals} renderSequence={renderSequence} selectionIndex={selectionIndex} Click={(id) => {setSelectionIndex(id)}} onAddButton={handlerAddbutton}/>

          {/* Signal renderer canvas */}
          <div id="canvas-wrapper">
            <div style={{ width: canvasConfig.timeStamp * canvasConfig.dx, height: canvasConfig.signalCount * (canvasConfig.dy + canvasConfig.offsetY) + 100, position: 'relative' }}>
              <Grid
                style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} 
                dx={canvasConfig.dx} dy={canvasConfig.dy} mouse={mousePos} prevMouse={prevMousePos} dragging={isDragging} offsetY={canvasConfig.offsetY}timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount}
              />
              <SignalWindow
                style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
                signals={signals} renderSequence={renderSequence} selectionIndex={selectionIndex} dx={canvasConfig.dx} dy={canvasConfig.dy} offsetY={canvasConfig.offsetY} timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount} onDown={handlerMouseDownMain} onMove={(e) => {handlerMouseMoveMain(e)}} onUp={(e) => {handlerMouseUpMain(e)}}
              />
            </div>
          </div>
        </div>
        
        {/* UI elements holder */}
        <div id="ui-panel">
          <div className='control-group'>
            <h3>Signals</h3>
            {(selectionIndex >= 0 && signals.length > 0) && (<input className='input' type='text' value={signals[selectionIndex].name} onChange={(value) => handlerSignalNameInput(value)}></input>)}
            {(selectionIndex >= 0 && signals.length > 0) && (<input className='input' type='text' value={signals[selectionIndex].wave} onChange={(value) => handlerWaveInput(value)}></input>)}
            {(selectionIndex >= 0 && signals.length > 0) && (<input className='input' type='text' value={signals[selectionIndex].data} onChange={(value) => handlerDataInput(value)}></input>)}
            {(selectionIndex >= 0 && signals.length > 0) && (<Slider name="Width" value={signals[selectionIndex].width} min={0.1} max={5} onChange={(e) => handlerSignalWidthSlider(e)}/>)}
          </div>
          <div className="control-group">
            <h3>Controls</h3>
            <Slider name="Time stamp" value={canvasConfig.timeStamp} min={5} max={500} onChange={(val) => setCanvasConfig(prev => ({...prev, timeStamp : val}))}/>
            <Slider name="Time scale" value={canvasConfig.dx} min={15} max={80} onChange={(val) => setCanvasConfig(prev => ({...prev, dx : val}))}/>
          </div>
          <div contentEditable="true" className='control-group' style={{fontFamily:"monospace"}}>
            {(selectionIndex >= 0 && signals.length > 0) && (<pre> <span style={{ color: 'blue', fontFamily:"courier"}}>Wave</span>: {JSON.stringify(signals, null, 2)} </pre>)}
          </div>
        </div>
        {/* Tab panel */}
        <TabBar tabs={tabs} renderSequence={tabRenderSequence} selectionIndex={selectionTab} onKeyDown={handleKeyDown} onAddDown={handlerAddTab} onClick={handerlTabClick}/>

      </div>
    </div>
  );
}


export default App;


function flip(inp)
{
  if(inp === '1')return '0';
  else if( inp === '0')return '1';
}