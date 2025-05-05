import logo from './logo.svg';
import './App.css';
import './comp/button';
import Button from './comp/button';
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
  
  //Signal data
  const [signals, SetSignals] = useState([]);

  //render sequence
  const [renderSequence, setRenderSequence] = useState([]);

  //selected items
  const [selectionIndex, setSelectionIndex] = useState(-1);

  //mouse position
  const[mousePos, setMousePos] = useState([0,0]);
  const[prevMousePos, setPrevMousePos] = useState([0,0]);
  const[isDragging, setIsDraggin] = useState(false);


  //................................ EVENT HANDLERS............................................
  //Adds new signal
  const handlerAddbutton = () => {
    var randomSignal = (1024 * Math.sin(Math.random()) >>> 0).toString(2);
    //console.log(randomSignal);
    const newItem = {name : 'Signal' , data : randomSignal, width : 1}
    SetSignals(prev => [...prev, newItem]);
    setCanvasConfig(prev => ({...prev, signalCount : canvasConfig.signalCount + 1}));
    setRenderSequence(prev => [...prev, signals.length]);
  };

  const handlerSignalNameInput = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : e.target.value, data : signal.data, width : signal.width};
      }
      else return signal;
    });

    SetSignals(updatedSignal);
  }

  const handlerSignalDataInput = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : signal.name, data : e.target.value, width : signal.width};
      }
      else return signal;
    });
    SetSignals(updatedSignal);
  }

  const handlerSignalWidthSlider = (e) =>
  {
    const updatedSignal = signals.map((signal, i) => {
      if(i === selectionIndex){
        return {name : signal.name, data : signal.data, width : e};
      }
      else return signal;
    });

    SetSignals(updatedSignal);
  }

  //Mouse control
  //Handle mouse down on main canvas
  const handlerMouseDownMain = (e) =>
  {
    console.log("mouse down");
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
      const copyBit = signals[y].data[x1];
      //update signal
      if(y < canvasConfig.signalCount){
        const updatedSignal = signals.map((signal, i) => {
          if(i === y){
            
            //strech signal
            if(Math.max(x, x1) > signal.data.length)
            {
              let prevData = signal.data;
              let sig = signal.data.split('');
              //sig = sig + sig[sig.length-1].reapeat(x - sig.length);
              return {name : signal.name, data : prevData + sig[0].repeat(x-sig.length+1), width : signal.width};
            }

            //else toggle signal
            else 
            {
              let chars = signal.data.split('');
              const minx = Math.min(x ,x1);
              const maxX = Math.max(x, x1);
              for(var j = minx; j <= maxX;j++){
                chars[j] = copyBit;
              }
              return {name : signal.name, data : chars.join(''), width : signal.width};
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
            if(x > signal.data.length)
            {
              let prevData = signal.data;
              let sig = signal.data.split('');
              //sig = sig + sig[sig.length-1].reapeat(x - sig.length);
              return {name : signal.name, data : prevData + sig[0].repeat(x-sig.length+1), width : signal.width};
            }

            //else toggle signal
            else 
            {
              let chars = signal.data.split('');
              chars[x] = chars[x] === '0' ? '1' : '0';
              return {name : signal.name, data : chars.join(''), width : signal.width};
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
    if(e === 'ArrowUp' && currentRenderIndex >= 1)
    {
      console.log("Moving up " + currentRenderIndex + " Moving down ");
      var newSequence = [...renderSequence];
      var temp = renderSequence[currentRenderIndex];
      newSequence[currentRenderIndex] = newSequence[currentRenderIndex-1];
      newSequence[currentRenderIndex-1] = temp;
      setRenderSequence(newSequence);
      console.log("Moving up ", renderSequence);
    }
  }

  //.................................MAIN HTML RETURN.........................................
  return (
    /* App */
    <div className="App">
      {/* The mani container of the app */}
      <div id="container">
        <div id="banner">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>WaveReact</h1>
        </div>
        {/* The OUTPUT of the app. Signal and it's names */}
        <div id="output-panel">

          {/* Signal names div*/}
          <SignalNameDiv signals={signals} renderSequence={renderSequence} Click={(index) => {setSelectionIndex(renderSequence.indexOf(index))}}/>

          {/* Signal renderer canvas */}
          <div id="canvas-wrapper">
            <Grid dx={canvasConfig.dx} dy={canvasConfig.dy} mouse={mousePos} prevMouse={prevMousePos} dragging={isDragging} offsetY={canvasConfig.offsetY}timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount} />
            <SignalWindow signals={signals} renderSequence={renderSequence} selectionIndex={selectionIndex} dx={canvasConfig.dx} dy={canvasConfig.dy} offsetY={canvasConfig.offsetY} timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount} onDown={handlerMouseDownMain} onMove={(e) => {handlerMouseMoveMain(e)}} onUp={(e) => {handlerMouseUpMain(e)}}/>
          </div>

        </div>
        
        {/* Tab panel */}
        <TabBar onKeyDown={handleKeyDown}/>

        {/* UI elements holder */}
        <div id="ui-panel">
          <div className="control-group">
            <h3> New signal </h3>
            <Button className="button-6" text="Add" onClick={handlerAddbutton} />
            <Slider name="Time stamp" value={canvasConfig.timeStamp} min={5} max={500} onChange={(val) => setCanvasConfig(prev => ({...prev, timeStamp : val}))}/>
            <Slider name="Time scale" value={canvasConfig.dx} min={15} max={80} onChange={(val) => setCanvasConfig(prev => ({...prev, dx : val}))}/>
          </div>
          <div className='control-group'>
            <h3>Modify signal</h3>
            {(selectionIndex >= 0 && signals) && (<input className='input' type='text' value={signals[selectionIndex].name} onChange={(value) => handlerSignalNameInput(value)}></input>)}
            {(selectionIndex >= 0 && signals) && (<input className='input' type='text' value={signals[selectionIndex].data} onChange={(value) => handlerSignalDataInput(value)}></input>)}
            {(selectionIndex >= 0 && signals) && (<Slider name="Width" value={signals[selectionIndex].width} min={0.1} max={5} onChange={(e) => handlerSignalWidthSlider(e)}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}


export default App;
