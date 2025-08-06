import React from 'react';

// Configurable top offset for SVG content
const topOffset = 10; // Adjust this value to change the top padding of the SVG
const baseX = 20; // Base X position for rendering
const indentPerLevel = 20; // Indentation per nesting level
const bracketWidth = 10; // Width of the bracket

export default function SignalNameDiv({ signals, dy, offsetY, signalCount, selectionIndex, Click }) {
    

    // Calculate total height for SVG
    const calculateHeight = (items) => {
        let height = 0;
        items.forEach(item => {
            if (Array.isArray(item)) {
                height += dy + offsetY; // For group name
                height += calculateHeight(item.slice(1)); // Process children
            } else if (Object.keys(item).includes('name') || IsEmpty(item)) {
                height += dy + offsetY; // For signal
            }
        });
        return height;
    };

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
                        x={bracketXStart + bracketWidth / 2 + 10}
                        y={currentY + groupHeight / 2 + dy / 2 - 10}
                        transform={`rotate(-90, ${bracketXStart + bracketWidth / 2}, ${currentY + groupHeight / 2 + dy / 2})`}
                        textAnchor="middle"
                        fill="purple"
                        fontSize={12}
                    >
                        {groupName}
                    </text>
                );

                // Right-facing bracket
                elements.push(
                    <path
                        key={`bracket-${level}-${index}`}
                        d={`M${bracketXEnd},${currentY+4}
                           L${bracketXStart},${currentY+4} 
                           L${bracketXStart},${currentY + groupHeight-4}
                           L${bracketXEnd},${currentY + groupHeight-4}`}
                        stroke="black"
                        strokeWidth="2"
                        fill="none"
                    />
                );

                currentY += offsetY; // Space for group name
                elements.push(...renderItems(children, level + 1, currentY));
                currentY += groupHeight;
            }
            
            //If it's a JSON object
            else if (Object.keys(item).includes('name')) {
                // Signal name (right of bracket)
                const signalX = baseX + level * indentPerLevel + bracketWidth-10;
                elements.push(
                    <text
                        key={`signal-${level}-${index}`}
                        className="signal-label"
                        x={signalX}
                        y={currentY + dy / 2}
                        textAnchor="start"
                        fill="blue"
                        onClick={() => Click && Click(index)}
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

    const maxLevel = calculateMaxLevel(signals);
    const maxNameLength = calculateMaxNameLength(signals);
    const totalHeight = calculateHeight(signals) + topOffset;
    const totalWidth = baseX + maxLevel * indentPerLevel + maxNameLength * 9;

    return (
        <svg
            id="nameList"
            width={totalWidth}
            height={totalHeight}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 3, backgroundColor: "white" }}
        >
            {renderItems(signals)}
        </svg>
    );
}

export function GetNameSVGWidth(signals)
{
    const value = baseX + calculateMaxLevel(signals) * indentPerLevel + calculateMaxNameLength(signals) * 9 ;
    console.log(value);
    return value;
}


// Calculate max name length for width adjustment
const calculateMaxNameLength = (items, maxLength = 0) => {
    items.forEach(item => {
        if (Array.isArray(item)) {
            maxLength = Math.max(maxLength, item[0].length); // Group name
            maxLength = calculateMaxNameLength(item.slice(1), maxLength); // Children
        } else if (Object.keys(item).includes('name')) {
            maxLength = Math.max(maxLength, item.name.length);
        }

    });
    return maxLength;
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
