import logo from './logo.svg';
import './App.css';
import './comp/button';
import Button from './comp/button';
import Grid from './core/grid';
import { useState } from 'react';
import Slider from './comp/slider';
import SignalWindow from './core/signal';
import SignalLabel from './comp/signalName';

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
  const [signals, SetSignals] = useState([
    ]);

  //render sequence
  const [renderSequence, setRenderSequence] = useState(0);


  //................................ EVENT HANDLERS............................................
  //Adds new signal
  const handlerAddbutton = () => {
    const newItem = {name : 'Signal' , data : '0101010110'}
    SetSignals(prev => [...prev, newItem]);
    setCanvasConfig(prev => ({...prev, signalCount : canvasConfig.signalCount + 1}));
  };

  //Mouse control
  //Handle mouse down on main canvas
  const handlerMouseDownMain = (e) =>
  {
    const x = e.x;
    const y = e.y;

    console.log("Mouse clicked: " + x + " " + y +" " + canvasConfig.signalCount);

    //update signal
    if(y < canvasConfig.signalCount){
      const updatedSignal = signals.map((signal, i) => {
        if(i === y ){
          let chars = signal.data.split('');
          chars[x] = chars[x] === '0' ? '1' : '0';
          return {name : signal.name, data : chars.join('')};
        }
        else return signal;
      });
      SetSignals(updatedSignal);
    }
     
  };

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
          <SignalLabel signals={signals} Click={(a) => (console.log(a))}/>

          {/* Signal renderer canvas */}
          <div id="canvas-wrapper">
            <Grid dx={canvasConfig.dx} dy={canvasConfig.dy} offsetY={canvasConfig.offsetY}timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount} />
            <SignalWindow signals={signals} dx={canvasConfig.dx} dy={canvasConfig.dy} offsetY={canvasConfig.offsetY} timeStamp={canvasConfig.timeStamp} signalCount={canvasConfig.signalCount} onClick={handlerMouseDownMain}/>
          </div>

          
        </div>
        {/* UI elements holder */}
        <div id="ui-panel">
          <div className="control-group">
            <h3> New signal </h3>
            <Button className="button-6" text="Add" onClick={handlerAddbutton} />
            <Slider name="Time stamp" value={canvasConfig.timeStamp} min={5} max={500} onChange={(val) => setCanvasConfig(prev => ({...prev, timeStamp : val}))}/>
            <Slider name="Time scale" value={canvasConfig.dx} min={15} max={80} onChange={(val) => setCanvasConfig(prev => ({...prev, dx : val}))}/>
          </div>
        </div>
        
      </div>
      
    </div>
  );
}


export default App;
