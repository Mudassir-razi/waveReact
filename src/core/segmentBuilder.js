
//The State table key is fasioned like prevState + currentState
const validPrevState = ['L', 'H', 'Z', 'B', 'P', 'N'];
const validCurrState = ['0', '1', 'H', 'L', 'Z', 'P', 'N', 'B', '.'];

const SegmentTable = 
{
    //Pstate == 1
    "L1" :      [0, 1, 7, 8],
    "N1" :      [0, 1, 7, 8],
    "H1" :      [5, 6, 4, 7, 8],
    "P1" :      [5, 6, 4, 7, 8],
    "B1" :      [0, 1, 7, 8, 5],
    "Z1" :      [9, 4, 7, 8],

    //Pstate == 0
    "L0" :      [0, 1, 4, 2, 3],
    "N0" :      [0, 1, 4, 2, 3],
    "H0" :      [5, 6, 2, 3],
    "P0" :      [5, 6, 2, 3],
    "B0" :      [5, 6, 2, 3, 0],
    "Z0" :      [9, 4, 2, 3],

    //Pstate == H
    "LH" :      [0, 5, 8],
    "HH":       [5, 6, 2, 3],
    "BH" :      [0, 5, 8],
    "ZH" :      [9, 4, 7, 8],       //TODO 
    "PH" :      [5, 6, 2, 3],
    "NH" :      [0, 5, 8],
    
    //Pstate == L
    "LL" :      [0, 1, 4, 2, 3],
    "HL" :      [5, 0, 3],
    "BL" :      [5, 0, 3],
    "ZL" :      [9, 4, 2, 3],       //TODO
    "PL" :      [5, 0, 3],
    "NL" :      [0, 1, 4, 2, 3],

    //Pstate == Z
    "LZ" :      [0, 1, 4, 10],
    "HZ" :      [5, 6, 4, 10],
    "BZ" :      [5, 6, 4, 10, 4, 1, 0],
    "PZ" :      [5, 6, 4, 10],
    "NZ" :      [0, 1, 4, 10],
    "Z" :       [9, 10],

    //Pstate == Bus
    "LB" :      [[0, 1, 7, 8], [1, 3]],
    "HB" :      [[5, 6, 2, 3], [6, 8]],
    "BB" :      [[0, 1, 7, 8], [5, 6, 2, 3]],
    "ZB" :      [[8, 7, 4, 9], [4, 2, 3]],
    "PB" :      [[5, 6, 2, 3], [6, 8]],
    "NB" :      [[0, 1, 7, 8], [1, 3]],

    //Pstate == P
    "LP" :      [0, 11, 12, 8],
    "HP" :      [5, 0, 11, 12, 8],
    "BP" :      [5, 0, 11, 12, 8],
    "ZP" :      [9, 0, 11, 12, 8],
    "NP" :      [0, 11, 12, 8],
    "PP" :      [5, 0, 11, 12, 8],

    //Pstate == N
    "LN" :      [0, 5, 12, 11, 3],
    "HN" :      [5, 12, 11, 3],
    "BN" :      [0, 5, 12, 11, 3],
    "ZN" :      [9, 5, 12, 11, 3],
    "PN" :      [5, 12, 11, 3],
    "NN" :      [5, 12, 11, 3],

    //Pstate == .
    "L." :      [0, 3],  
    "H." :      [5, 8],
    "B.":       [[0, 3], [5, 8]],
    "Z.":       [9, 10],
    "P.":       [5, 0, 11, 12, 8],
    "N.":       [0, 5, 12, 11, 3],


    //PState == Bus but not lines, shapes
    "LBS":  [1, 7, 8, 3],
    "HBS":  [6, 2, 3, 8],
    "BBS":  [[0, 1, 4, 6, 5], [3, 2, 4, 7, 8]],
    "ZBS":  [8, 7, 4, 2, 3],
    "B.S":  [5, 8, 3, 0],
    "NBS":  [1, 7, 8, 3],
    "PBS":  [6, 2, 3, 8],
    
    "B0S":  [0, 2, 6, 5],
    "B1S":  [0, 1, 7, 5],
    "BZS":  [5, 6, 4, 1, 0],
    "BHS":  [],
    "BLS":  [],
    "BPS":  [],
    "BNS":  [],
};

/**
 * This function returns the list of point indices for the given current and previous state
 * This indices can be used to lookup the points from the LUT to draw the signal segment.
 * @param {string} currentState Current symbol in the signal
 * @param {string} prevState previous symbol in the signal
 * @returns 
 */
export function getSegmentPointIndices(currentState, prevState, shapeFill=false)
{   
    const encodedPrevState = convertToPreviousStateEncoding(prevState);
    if(!validPrevState.includes(encodedPrevState))throw new Error("Invalid signal: Unrecognized previous state- "+ String(encodedPrevState));
    if(!validCurrState.includes(currentState))throw new Error("Invalid signal: Unrecognized current state- " + String(currentState));
    const combinedState = convertToPreviousStateEncoding(prevState) + currentState + (shapeFill ? "S" : "");
    if(!Object.keys(SegmentTable).includes(combinedState))throw new Error("Invalid signal : " + String(combinedState));
    //console.log(combinedState, SegmentTable[combinedState]);
    return SegmentTable[combinedState];
}

function convertToPreviousStateEncoding(state)
{
    switch(state)
    {
        case "1": return "H";
        case "H": return "H";
        case "0": return "L";
        case "L": return "L";
        case "Z": return "Z";
        case "B": return "B";
        case "X": return "B";
        default: return state;
    }
}