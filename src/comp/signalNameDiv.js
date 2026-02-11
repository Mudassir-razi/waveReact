// Configurable top offset for SVG content
//const baseX = 20; // Base X position for rendering
//const indentPerLevel = 20; // Indentation per nesting level
//const charWidth = 6; // Width of the bracket

export default function SignalNameDiv({pos, signalNames, hierarchy, maxLevel, height, width, config, viewMode=true}) {

    const namePlateWidth = width;
    const namePlateHeight= height;
    const nameOffset = width - 20;//maxLevel * config.indentPerLevel + config.nameStart;
    const textColor = viewMode ? "black" : "white";
    const bgColor   = viewMode ? "white" : "transparent";

        return (
            <svg
                x={pos.x}
                y={pos.y}
                width={namePlateWidth}
                height={namePlateHeight}
            >
                <rect
                    key={'backDropNameDiv'}
                    width={namePlateWidth}
                    height={namePlateHeight}
                    fill={bgColor}
                />

                {signalNames.map((name, i) => (
                <text
                    key={i}
                    x={0}                   
                    y={0}           
                    fill={textColor}
                    textAnchor="end"
                    fontSize={14}
                    fontFamily="monospace"
                    transform={`translate(${nameOffset}, ${(i+1) * (config.dy + config.offsetY)})`}
                >
                    {name}
                </text>
                   
                ))}
                {hierarchy.map((b, i) => (
                    <RightBracket bracket={b} config={config} color={textColor}></RightBracket>
                ))}
            </svg>
        );
}


function RightBracket({ bracket, config, color }) {
  
    if(!Object.keys(bracket).includes('text'))return null;
    const groupText = typeof bracket.text === 'string' ? bracket.text : " ";

    const arm = 4.5;
    const x = config.nameStart + (bracket.level * config.indentPerLevel);
    const midY = (config.dy + config.offsetY) * (((bracket.start + bracket.end) / 2) + 1);
    
    const d = `
        M ${x} ${((bracket.start + 1) * (config.dy + config.offsetY)) - 10}
        h ${-arm}
        V ${((bracket.end + 1) * (config.dy + config.offsetY)) + 10}
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
            transform={`translate(${x - (3*arm)}, ${midY}) rotate(-90)`}
            >
            {groupText}
        </text>
        </g>
    );
}



