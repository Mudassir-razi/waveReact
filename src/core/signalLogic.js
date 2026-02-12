import { flattenSignals } from "./parser";
import {expandWavePattern} from "./waveFormWindowManager";

export function modifyOnMouseEvent(signals, timeStamp, signalIdx, timeStampPrev, signalIdxPrev, action)
{
    const flatSignals = flattenSignals(signals);
   
    const currentSignal = flatSignals[signalIdx];
    const currentWave = expandWavePattern(currentSignal.wave);

    const preWave = currentWave.substring(0, timeStamp);
    const postWave = currentWave.substring(timeStamp + 2);

    const actualNeighbours = getActual(currentWave, timeStamp);
    const prevSymbol =  actualNeighbours[0];
    const currentSymbol =  actualNeighbours[1];
    const nextSymbol =  actualNeighbours[2];
    let newSymbol = currentSymbol;

    if(timeStampPrev === timeStamp){
        switch(action)
        {
            case "10":
            {
                const cn = currentSymbol === prevSymbol ?  (currentSymbol === "0" ? "1" : "0") : '.'; 
                const nn = nextSymbol === currentSymbol ?  nextSymbol : '.';
                newSymbol = cn + nn;
                break;
            }
        }
        const newWaveform = preWave + newSymbol + postWave;
        return updateSignalAtIndex(structuredClone(signals), signalIdx, newWaveform);
    }
    return signals;
}

function updateSignalAtIndex(updatedSignals, signalIdx, newWaveform, count=-1)
{

    //Locate the signal in the original nested structure and update its waveform

    for (let i = 0; i < updatedSignals.length; i++) {
        if (Array.isArray(updatedSignals[i])) {
            updatedSignals[i] = updateSignalAtIndex(updatedSignals[i], signalIdx, newWaveform, count);
        } else {
            count++;
            if (count === signalIdx) {
                updatedSignals[i].wave = newWaveform;
            }
        }
    }

    return updatedSignals;
}

function getActual(wave, index)
{
    console.log(wave, index);
    var actual = [' ', ' ', ' '];
    for(let i = index-1; i >= 0; i--)
    {   
        if(wave[i] !== '.') {actual[0] = wave[i];break;}
    }
    actual[1] = wave[index] === '.' ? actual[0] : wave[index];
    actual[2] = index+1 < wave.length ? (wave[index+1] === '.' ? actual[1] : wave[index+1]) : ' ';
    console.log(actual);
    return actual;
}