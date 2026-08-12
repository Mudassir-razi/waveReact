import SignalNameDiv from "../comp/signalNameDiv";
import SignalWindow from "./signal";
import { TimeRuler } from "./grid";
import { flattenSignals } from "../core/parser";
import { combineAndSaveSVG } from "./fileSys";
import { serializeSvg } from "./svgOptimizer";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  getHierarchy,
  getSignalNames,
  getMaxLevel,
  getMaxNameLength,
  standardizeSignal,
  getMaxWaveLength,
} from "./waveFormWindowManager";
import { Box } from "@mui/material";
import { useAppConfig } from "../core/config";

let svgRefs = { signal: null, ruler: null, name: null, darkMode: true };

const EXPORT_OPTIONS = { crop: true, optimize: true };

/**
 * Builds the exportable document: cropped to the drawn waveform and rewritten
 * into compact markup. The live canvas is untouched.
 * @returns {SVGSVGElement|null}
 */
export function getSVG() {
  const { signal, ruler, name, darkMode } = svgRefs;
  if (!signal || !ruler || !name) return null;
  return combineAndSaveSVG(signal, ruler, name, darkMode, EXPORT_OPTIONS);
}

/**
 * @returns {string} Serialized, compressed SVG ready to save or paste.
 */
export function getSVGString() {
  return serializeSvg(getSVG());
}

export default function WaveFormWindow({
    signals,
    anno,
    mode,
    state,
    start,
    end,
    foot,
    mouseDownSVG,
    mouseUpSVG,
    annotationMode,
    curveP1,
    curveP2,
    breakMode,
    onAnnotationUpdate,
    onAnnotationDelete,
    onBreakUpdate,
    onBreakDelete,
})
{
    //console.log("Waveform window");
    //To calculate viewport size
    const containerRef = useRef(null);
    const config = useAppConfig().config;
    // Kept as state only so a resize triggers a redraw at the new size.
    const[, setViewport] = useState({});
    //.....................................Custom scroll....................
    const scrollRef = useRef(null);
    const scrollBoxRef = useRef(null);
    const rulerRef = useRef(null);
    const namesRef = useRef(null);

    // The pane around the canvas is what scrolls, not the canvas itself, and a
    // scroll event does not bubble out of it. Listening anywhere else leaves
    // the ruler and the name column behind when the diagram is panned.
    useEffect(() => {
        const node = scrollBoxRef.current;
        if (!node) return undefined;

        const handleScroll = () => {
        const { scrollTop, scrollLeft } = node;

        if (rulerRef.current) {
            rulerRef.current.style.transform = `translateX(${-scrollLeft}px)`;
        }
        if (namesRef.current) {
            namesRef.current.style.transform = `translateY(${-scrollTop}px)`;
        }
        };

        node.addEventListener("scroll", handleScroll);
        return () => node.removeEventListener("scroll", handleScroll);
    }, []);
//...............................................................................

    const signalCopyData = structuredClone(signals);


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
    const flatSignalData = flattenSignals(signals);
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

    // Only the layer refs are recorded here; the export document is built on
    // demand so editing does not pay for a full tree clone on every keystroke.
    useLayoutEffect(() => {
        svgRefs = {
          signal: scrollRef.current,
          ruler: rulerRef.current,
          name: namesRef.current,
          darkMode: config.darkMode ?? true,
        };
    }, [
        totalWidth,
        totalHeight,
        signals,
        anno,
        config.darkMode,
        maxWaveLength,
        standardSignal.length,
    ]);

    return (
        <Box
        sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            overflow: "hidden",
            bgcolor:  config.darkMode ? "transparent" : "#ffffff" 
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
            height: "100%",
            bgcolor: config.darkMode ? "transparent" : "#ffffff"   
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
                maxWaveLength={maxWaveLength}
            />
            </Box>

            {/* MAIN SCROLL OWNER */}
            <Box
            ref={scrollBoxRef}
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
                anno={anno}
                maxWaveLength={maxWaveLength}

                height={waveformSVGHeight}
                width={waveFormSVGWidth}
                
                viewMode={false}
                mouseDownSVG={mouseDownSVG}
                mouseUpSVG={mouseUpSVG}

                mode={mode}
                state={state}
                start={start}
                end={end}
                foot={foot}
                annotationMode={annotationMode}
                curveP1={curveP1}
                curveP2={curveP2}
                breakMode={breakMode}
                onAnnotationUpdate={onAnnotationUpdate}
                onAnnotationDelete={onAnnotationDelete}
                onBreakUpdate={onBreakUpdate}
                onBreakDelete={onBreakDelete}
            />
            </Box>
        </Box>
        </Box>
    );
}
