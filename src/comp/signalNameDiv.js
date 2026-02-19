// Configurable top offset for SVG content
//const baseX = 20; // Base X position for rendering
//const indentPerLevel = 20; // Indentation per nesting level
//const charWidth = 6; // Width of the bracket
import { forwardRef } from "react";



const SignalNameDiv = forwardRef(({pos, signalNames, hierarchy, height, width, config, viewMode}, ref) =>
{
    const namePlateWidth = width;
    const namePlateHeight= height;
    const nameOffset = width - 20;//maxLevel * config.indentPerLevel + config.nameStart;
    const textColor = viewMode ? "black" : "white";
    const bgColor   = viewMode ? "white" : "transparent";

        return (
            <svg
                x={pos.x}
                y={pos.y}
                ref={ref}
                width={namePlateWidth}
                height={namePlateHeight}
                viewBox={`0 0 ${namePlateWidth} ${namePlateHeight}`}
                display="block"
            >
                <rect
                    key={'backDropNameDiv'}
                    width={namePlateWidth}
                    height={namePlateHeight}
                    fill={bgColor}
                />

                {signalNames.map((name, i) => {
                  const splitName = name.split(' ');
                  const diff = 0.3;
                  if(splitName.length === 1){
                  return (
                    <text
                        key={i}
                        x={0}                   
                        y={0}           
                        fill={textColor}
                        textAnchor="end"
                        fontSize={14}
                        fontFamily="monospace"
                        transform={`translate(${nameOffset}, ${(i+1) * (config.dy + config.offsetY) + pos.y})`}
                    >
                        {name}
                    </text>
                )}
                    else{
                        return (
                            <>
                            <text
                            key={i}
                            x={0}                   
                            y={0}           
                            fill={textColor}
                                textAnchor="end"
                                fontSize={14}
                                fontFamily="monospace"
                                transform={`translate(${nameOffset}, ${(i+1-diff) * (config.dy + config.offsetY) + pos.y})`}
                            >
                                {splitName[0]}
                            </text>
                            <text
                            key={i}
                            x={0}                   
                            y={0}           
                            fill={textColor}
                                textAnchor="end"
                                fontSize={14}
                                fontFamily="monospace"
                                transform={`translate(${nameOffset}, ${(i+1+diff) * (config.dy + config.offsetY) + pos.y})`}
                            >
                                {splitName[1]}
                            </text>
                            </>
                        )
                    }
                })}
                {hierarchy.map((b, i) => (

                    <RightBracket bracket={b} config={config} color={textColor} posy={pos.y}></RightBracket>
                ))}
            </svg>
        );
});

export default SignalNameDiv;

function RightBracket({ bracket, config, color, posy }) {
  
    if(!Object.keys(bracket).includes('text'))return null;
    const groupText = typeof bracket.text === 'string' ? bracket.text : " ";

    const arm = 4.5;
    const x = config.nameStart + (bracket.level * config.indentPerLevel);
    const midY = (config.dy + config.offsetY) * (((bracket.start + bracket.end) / 2) + 1);
    
    const d = `
        M ${x} ${((bracket.start + 1) * (config.dy + config.offsetY)) - 10 + posy}
        h ${-arm}
        V ${((bracket.end + 1) * (config.dy + config.offsetY)) + 10 + posy}
        h ${arm}
    `;

    return (
        <g>
        {/* Bracket */}
        <path
            d={d}
            stroke={color}
            strokeWidth={1.5}
            fill="none"
        />

        {/* Text */}
        <text
            x={0}
            y={0}
            fill={color}
            fontSize={12}
            dominantBaseline="middle"
            textAnchor="middle"
            transform={`translate(${x - (3*arm)}, ${midY + posy}) rotate(-90)`}
            >
            {groupText}
        </text>
        </g>
    );
}



