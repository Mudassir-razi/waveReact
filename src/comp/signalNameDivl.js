import { flattenJson } from "../core/parser";

// Configurable top offset for SVG content
const topOffset = 10; // Adjust this value to change the top padding of the SVG
const baseX = 20; // Base X position for rendering
const indentPerLevel = 15; // Indentation per nesting level
const bracketWidth = 10; // Width of the bracket

export default function SignalNameDiv({ signals, dy, offsetY, viewMode }) {
    

    // Calculate total height for SVG
    const calculateHeight = (items) => {
        let height = 0;
        items.forEach(item => {
            if (Array.isArray(item)) {
                //height += dy + offsetY; // For group name
                height += calculateHeight(item.slice(1)); // Process children
            } else if (Object.keys(item).includes('name') || IsEmpty(item)) {
                height += dy + offsetY; // For signal
            }
        });
        return height;
    };

    const maxLevel = calculateMaxLevel(signals);
    const maxNameLength = calculateMaxNameLength(signals);
    const totalHeight = calculateHeight(signals) + topOffset;
    const totalWidth = baseX + maxLevel * indentPerLevel + maxNameLength + 30;

    // Render items recursively
    const renderItems = (items, level = 0, startY = topOffset) => {
        let currentY = startY;
        const elements = [];

        items.forEach((item, index) => {
            if (Array.isArray(item)) {
                const groupName = item[0];
                const children = item.slice(1);
                const groupHeight = calculateHeight(children);

                // Bracket positions
                const bracketXStart = baseX + level * indentPerLevel;
                const bracketXEnd = bracketXStart + bracketWidth;

                // Group name (vertical, centered in bracket)
                elements.push(
                    <text
                        key={`group-${level}-${index}`}
                        className="group-label"
                        x={bracketXStart + bracketWidth / 2 + 16}
                        y={currentY + groupHeight / 2 + dy / 2 - 10}
                        transform={`rotate(-90, ${bracketXStart + bracketWidth / 2}, ${currentY + groupHeight / 2 + dy / 2})`}
                        textAnchor="middle"
                        fill={viewMode ? "blue" :"#5e83b8ff"}
                        fontSize={12}
                    >
                        {groupName}
                    </text>
                );

                // Right-facing bracket
                //Bracket paramters
                const radius = 1;
                const xStart = bracketXStart;
                const xEnd = bracketXEnd;
                const yStart = currentY;
                const yEnd = currentY + groupHeight - 12 ;

                const d = `
                M ${xEnd},${yStart + radius}                             
                Q ${xEnd},${yStart} ${xEnd - radius},${yStart}           
                L ${xStart + radius},${yStart}                           
                Q ${xStart},${yStart} ${xStart},${yStart + radius}       
                L ${xStart},${yEnd - radius}                             
                Q ${xStart},${yEnd} ${xStart + radius},${yEnd}           
                L ${xEnd - radius},${yEnd}                               
                Q ${xEnd},${yEnd} ${xEnd},${yEnd - radius}               
                `;
                elements.push(
                    <path
                        key={`bracket-${level}-${index}`}
                        d={d}
                        stroke={viewMode ? "blue" : "#5e83b8ff"}
                        strokeWidth="1"
                        fill="none"
                    />
                );

                //currentY += offsetY; // Space for group name
                elements.push(...renderItems(children, level + 1, currentY));
                currentY += groupHeight;
            }
            
            //If it's a JSON object
            else if (Object.keys(item).includes('name')) {
                const maxLevel = calculateMaxLevel(signals);
                const signalX = baseX + maxLevel * indentPerLevel + maxNameLength + 20; // fixed column for all signals

                elements.push(
                    <text
                        key={`signal-${level}-${index}`}
                        className="signal-label"
                        left= {0}
                        x={signalX}
                        y={currentY + dy / 2}
                        textAnchor="end"
                        fill={viewMode ? "blue" :"#5e83b8ff"}
                    >
                        {item.name}
                    </text>
                );
                currentY += dy + offsetY;
            }
            else if(IsEmpty(item))
            {
               currentY += dy + offsetY;
            }
        });

        return elements;
    };

    return (
        <svg
            id="nameList"
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 3}}
        >
            <rect 
                width={totalWidth}
                height={totalHeight}
                style={{ position: "absolute", top: 0, left: 0, zIndex: 3, fill : viewMode ? "white" : "black"}}>
            </rect>
            {renderItems(signals)}
        </svg>
    );
}

export function GetNameSVGWidth(signals)
{
    const maxLevel = calculateMaxLevel(signals);
    const maxNameLength = calculateMaxNameLength(signals);
    console.log("Max Level : ", maxLevel, " Max Name Length : ", maxNameLength, " BaseX : ", baseX);
    const value = baseX + maxLevel * indentPerLevel + maxNameLength + 30;
//      const totalWidth = baseX + maxLevel * indentPerLevel + maxNameLength * 9;
    return value;
}


// Calculate max name length for width adjustment
const calculateMaxNameLength = (items) => {
    const flatSignals = flattenJson(items);
    var maxLength = 0;
    flatSignals.forEach(signal => {
        if (signal.name && signal.name.length > maxLength) {
            maxLength = signal.name.length;
        }
    });
    return  maxLength * 8.367 - 1.09;
};

// Calculate max nesting level for width
const calculateMaxLevel = (items, level = 0) => {
    let maxLevel = level;
    items.forEach(item => {
        if (Array.isArray(item)) {
            maxLevel = Math.max(maxLevel, calculateMaxLevel(item.slice(1), level + 1));
        }
    });
    return maxLevel;
};

function IsEmpty(element)
{
  return typeof element === "object" &&
            element  !== null &&
            Object.keys(element).length === 0 &&
            element.constructor === Object;
}

