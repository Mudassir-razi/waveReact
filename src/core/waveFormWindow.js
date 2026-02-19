import  SignalNameDiv from "../comp/signalNameDiv";
import  SignalWindow from "./signal";
import { TimeRuler } from "./grid";
import { flattenSignals } from "../core/parser";
import {combineAndSaveSVG} from "./fileSys";
import { useState, useEffect, useRef } from "react";
import {getHierarchy, getSignalNames, getMaxLevel, getMaxNameLength, standardizeSignal, getMaxWaveLength} from "./waveFormWindowManager";
import {Box} from '@mui/material';

var finalSVG;
export function getSVG(){return finalSVG;}

export default function WaveFormWindow({signals, config, mouseDownSVG, mouseUpSVG})
{
    //To calculate viewport size
    const containerRef = useRef(null);
    const[viewport, setViewport] = useState({});
    //.....................................Custom scroll....................
    const scrollRef = useRef(null);
    const rulerRef = useRef(null);
    const namesRef = useRef(null);

    useEffect(() => {
        const node = scrollRef.current;

        const handleScroll = () => {
        const { scrollTop, scrollLeft } = node;

        rulerRef.current.style.transform =
            `translateX(${-scrollLeft}px)`;

        namesRef.current.style.transform =
            `translateY(${-scrollTop}px)`;
        };

        node.addEventListener("scroll", handleScroll);
        return () => node.removeEventListener("scroll", handleScroll);
    }, []);
//...............................................................................

    //take data
    const [flatSignalData, setFlatSignalData] = useState([]);

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
    const maxWaveLength = getMaxWaveLength(standardSignal);

    const nameDivWidth = (maxLevel + 1) * config.indentPerLevel + maxNameLength * config.charWidth;
    const rulerHeight  = 20;    
    const waveFormSVGWidth = (maxWaveLength + 15) * config.dx;
    const waveformSVGHeight = (standardSignal.length+1) * (config.dy + config.offsetY);
    var posNameDiv       = {x : 0, y : rulerHeight};
    var posSignalWindow  = {x : 0, y : 0};
    
    const totalHeight = (standardSignal.length+1) * (config.dy + config.offsetY);
    const totalWidth = (maxWaveLength+3) * config.dx;
    finalSVG = combineAndSaveSVG(scrollRef.current, rulerRef.current, namesRef.current, totalWidth, totalHeight);

    return (
        <Box
        sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            bgcolor: "transparent"
        }}
        >
        {/* LEFT NAME PANEL */}
        <Box
            sx={{
            width: nameDivWidth,
            height: "100%",         
            overflow: "hidden",
            position: "relative",
            flexShrink: 0
            }}
        >
            <SignalNameDiv
                ref={namesRef}
                pos={posNameDiv}
                signalNames={signalNames}
                hierarchy={hierarchy}
                height={waveformSVGHeight}
                width={nameDivWidth}
                config={config}
                viewMode={false}
            />
        </Box>

        {/* RIGHT SIDE */}
        <Box
            sx={{
            flex: 1,
            display: "flex",
            minWidth:0,
            flexDirection: "column",
            height: "100%"   
            }}
        >
            {/* RULER */}
            <Box
            sx={{
                height: rulerHeight,
                overflow: "hidden",
                position: "relative",
                flexShrink: 0
            }}
            >
            <TimeRuler
                ref={rulerRef}
                config={config}
                maxWaveLength={maxWaveLength}
            />
            </Box>

            {/* MAIN SCROLL OWNER */}
            <Box
            sx={{
                flex: 1,
                overflow: "auto",
                minHeight: 0  
            }}
            >
            <SignalWindow
                ref={scrollRef}
                pos={posSignalWindow}
                signals={standardSignal}
                maxWaveLength={maxWaveLength}
                config={config}

                height={waveformSVGHeight}
                width={waveFormSVGWidth}
                
                viewMode={false}
                mouseDownSVG={mouseDownSVG}
                mouseUpSVG={mouseUpSVG}
            />
            </Box>
        </Box>
        </Box>
    );
}
