import  SignalNameDiv from "../comp/signalNameDiv";
import  SignalWindow from "./signal";

import { flattenSignals } from "../core/parser";
import { useState, useEffect, useRef } from "react";
import {getHierarchy, getSignalNames, getMaxLevel, getMaxNameLength, standardizeSignal, getMaxWaveLength} from "./waveFormWindowManager";
import {Box} from '@mui/material';

export default function WaveFormWindow({signals, config})
{
    //To calculate viewport size
    const containerRef = useRef(null);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });

    //take data
    const [flatSignalData, setFlatSignalData] = useState([]);
    var posNameDiv       = {x : 0, y : 0};
    var posSignalWindow  = {x : 0, y : 0};

    const signalCopyData = structuredClone(signals);

    //Change flat signals
    useEffect(() => {
        //console.log(signals);    
        const flatSignals = flattenSignals(signals);
        //console.log(flatSignals);
        setFlatSignalData(flatSignals);
    }, [signals]);

    //For calculating windowsize 
    useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setViewport({ width, height });
        //console.log(viewport);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
    }, []);


    //calculate stuff
    const standardSignal = standardizeSignal(flatSignalData);
    const hierarchy = getHierarchy(signalCopyData);
    const signalNames = getSignalNames();
    const maxLevel = getMaxLevel();
    const maxNameLength = getMaxNameLength();
    const height = (standardSignal.length+1) * (config.dy + config.offsetY);
    const nameDivWidth = (maxLevel + 1) * config.indentPerLevel + maxNameLength * config.charWidth;
    
    const maxWaveLength = getMaxWaveLength(standardSignal);
    const waveFormSVGWidth = maxWaveLength * config.dx;
    const viewPortWidth = config.dx * (maxNameLength > 56 ? 56 : maxWaveLength);

    //console.log(nameDivWidth, maxLevel, config);
    //posSignalWindow.x = nameDivWidth;
    
    //Scrollbar 
    const [hscrollValue, setHscrollValue] = useState(0);


    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",     
                minHeight: 0,       
            }}
            >
            <Box
                sx={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                minHeight: 0, 
                overflow: "hidden"
                }}
            >
                <Box
                sx={{
                    width: nameDivWidth, 
                    flexShrink: 0,
                }}
                >
                <SignalNameDiv
                    pos={posNameDiv}
                    signalNames={signalNames}
                    hierarchy={hierarchy}
                    maxLevel={maxLevel}
                    height={height}
                    width={nameDivWidth}
                    config={config}
                    viewMode={false}
                />
                </Box>

                {/* Right: Signal window */}
                <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    minWidth: 0,     // IMPORTANT for horizontal overflow
                    minHeight: 0,
                    overflow: "hidden",
                }}
                >
                <SignalWindow
                    pos={posSignalWindow}
                    signals={standardSignal}
                    config={config}
                    height={height}
                    width={waveFormSVGWidth}
                    vpHeight={height}
                    vpWidth={viewPortWidth}
                    viewMode={false}
                />
                </Box>
            </Box>      
            </Box>

    );
}