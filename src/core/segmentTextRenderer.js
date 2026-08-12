import React from 'react';

let dx = 0;
let offsetY = 0;
let scale = 1;

let busLength = 0;
let textOffset = 0;
let index = 0;
let data = [];

/**
 * 
 * @param {int} dx_ Segment width (Unscaled)
 * @param {int} dy_ Segment height
 * @param {int} offsetY_ Signal Y offset
 * @param {int} scale_ Scale 
 * @param {string} data_ Data string to render on text
 */
export function initTextRenderer(dx_, dy_, offsetY_, scale_, data_)
{
    dx = dx_;
    busLength = 0;
    offsetY = offsetY_;
    // Every renderer state is reset here so nothing carries over from the
    // signal drawn before this one.
    textOffset = 0;
    index = 0;
    scale = scale_;
    data = data_.split(',');
}

/**
 * 
 * @param {string} currentState Current signal segment
 * @param {string} prevState Previous (Valid) signal segment
 * @param {string} offsetX_ X offset of the current signal
 * @returns Tspan object, with appropriate data as text content
 */
export function getTextSegment(currentState, prevState, offsetX_)
{
    //if(data[0] === "")return null; //no data to show
    //we have a bus to work with
    if (currentState === "B" || prevState === "B")
    {
        const state = ((prevState === "B") ? prevState : "X") + ((currentState === "B" || currentState === ".") ? currentState : "X");
        switch(state){

            //bus started
            case "XB": 
            {
                busLength = 1;
                //x offset is always respect to bus start
                textOffset = offsetX_;
                return null;
            }

            //bus continues
            case "B.":
            {
                busLength++;
                return null;
            }

            case "BX":
            {
                //bus ends. text logic here
                const txt = getText();
                index++;
                return txt;
            }
            
            case "BB":
            {
                //Bus ends and a new bus starts.
                const txt = getText();
                index++;
                busLength = 1;
                //x offset is always respect to bus start
                textOffset = offsetX_;
                return txt;
            }
            default:
            {
                return null;
            }
        }
    }
    busLength = 0;
    return null;
}

/**
 * Forces Text segment return. useful at the signal end point as there will be no more states
 * @returns  Text segment
 */
export function getTextSegmentForce(){if(busLength !== 0)return getText();}


/**
 * Creates a Tspan object, puts string in it, returns the value
 * @returns Tspan object with text segment
 */
function getText() {
    if (index >= data.length) return null;

    const fontSize = 12;
    const lineHeight = 12;
    const textContent = data[index];

    const centerX =
        5 + textOffset + (busLength * dx * scale) / 2;

    const lines = textContent.split("\n");

    // ORIGINAL single-line position
    const baseY = offsetY + 15;

    // If only one line → keep original behavior
    if (lines.length === 1) {
        return (
            <tspan
                key={`t-${index}`}
                x={centerX}
                y={baseY}
                fontSize={fontSize}
            >
                {lines[0]}
            </tspan>
        );
    }

    // Multiline → center vertically around original baseY
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY = baseY - totalHeight / 2;

    return (
        <React.Fragment key={`t-${index}`}>
            {lines.map((line, i) => (
                <tspan
                    key={i}
                    x={centerX}
                    y={startY + i * lineHeight}
                    fontSize={fontSize}
                >
                    {line}
                </tspan>
            ))}
        </React.Fragment>
    );
}
