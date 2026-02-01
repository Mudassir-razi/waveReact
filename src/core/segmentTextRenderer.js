
let dx = 0;
let dy = 0;
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
    dy = dy_;
    busLength = 0;
    offsetY = offsetY_;
    index = 0;
    scale = scale_;
    data = data_.split(' ');
    console.log(data);
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
function getText()
{   
    if(index >= data.length)return null;
    const textContent = data[index];
    const textLen = textContent.length;
    if(textLen < (4 * busLength * scale)){
        const t1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        //console.log(textLen);
        //t1.setAttribute("x", textOffset + scale* dx*0.28 + busLength*14);
        t1.setAttribute("x", 5 + textOffset + (busLength * dx * scale)/2);
        t1.setAttribute("y", offsetY+15);
        t1.setAttribute("font-size", 20);
        t1.textContent =  textContent;
        return t1;
    }

    //If the text it too long, make two portions. 
    else if (textLen < (8 * busLength * scale)) {
        const part1 = data[index].substring(0, 4 * busLength - 1);
        const part2 = data[index].substring(4*busLength-1);

        const t1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        const t2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

        t1.textContent = part1;
        t2.textContent = part2;

        t1.setAttribute("x", 5 + textOffset + (busLength * dx * scale)/2);
        t1.setAttribute("y", offsetY+10);
        t1.setAttribute("font-size", 14);

        t2.setAttribute("x", 5 + textOffset + (busLength * dx * scale)/2);
        t2.setAttribute("y", offsetY+18);
        t2.setAttribute("font-size", 14);
        return [t1, t2];
    }
    return null;
}