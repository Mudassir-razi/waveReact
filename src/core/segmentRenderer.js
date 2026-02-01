//This is the look up table for the points and the signal segments
//Usage:
//1. Initialize the LUT by calling initRender
//2. Get SVG line giving it indices of the points by calling getLine

import { getSegmentPointIndices } from "./segmentBuilder.js";

//Global variables
let LUT = null;
let offsetY = 0;
let offsetX = 0;
let crisp = true;

//Shape variables
let shapeFragments = null;

/**
 * This function intializes the LUT dictionary for segments of the signal for rendering
 * @param {int} dx_ Width of the time stamp
 * @param {int} dy_ height of the time stamp
 * @param {int} div_ Transition coefficient
 * @param {int} offsetY_ Offset Vertical
 * @param {int} scale_ Horizontal scale
 * @param {boolean} crisp_ Whether to use crisp lines. Use true for odd line widths
 */
export function initRender(dx_, dy_, div_, offsetY_, scale_=1, crisp_=true)
{
  LUT = getDictionary(dx_, dy_, div_, offsetY_, scale_);
  shapeFragments = null;
  offsetY = offsetY_;
  crisp = crisp_;
}


/**
 * This function returns the SVG path string for the given list of point indices
 * @param {LinkStyle} indices List of indices of the points in the line
 * @param {int} offsetX Horizontal offset
 * @returns SVG path string 
 */
export function getLineSegment(currentState, prevState, offsetX_)
{
    offsetX = offsetX_;
    try {
      const indices = getSegmentPointIndices(currentState, prevState); 
      // If it's a list of lists: [[...], [...], ...]
      if (Array.isArray(indices[0])) return indices.map(sub => getWavelet(sub)).join(" ");
      // Normal case: [0, 1, 7, 8]
      return getWavelet(indices);
    
    } catch (error) {
        console.log(error);
        return "";
    }
}


/**
 * 
 * @param {String} currentState Current signal
 * @param {String} prevState Previous signal
 * @param {int} offsetX render offset X
 * @param {boolean} force Force return the current Shape. used at the end of the signal
 * @returns Returns a shape segment for bus, null if no bus shape needed in signal
 */
export function getShapeSegment(currentState, prevState, offsetX_)
{
    offsetX = offsetX_;
    try{
    //if we have to work with bus, then we go to bus shape handling
    if (currentState === "B" || prevState === "B") {
        const indices = getSegmentPointIndices(currentState, prevState, true);
        // console.log(prevState, currentState);
        // console.log(indices);
        //if it's a bus transition, we end the shape and start a new one
        if(currentState === "B" && prevState === "B") {    
          const ending = getWavelet(indices[0]);
          const start = getWavelet(indices[1]);
          const retSegment = shapeFragments + " " + ending;
          shapeFragments = start;
          return retSegment;
        }

        //If it's the continuation of the shape
        else if(prevState === "B" && currentState === '.') shapeFragments += getWavelet(indices);

        //If it's end of a shape, end it, send it back
        else if(prevState === "B")
        {
          const sf = shapeFragments;
          shapeFragments = "";
          return sf + getWavelet(indices);
        }

        //else, the shape has just started, no need to send anything back
        else 
        {
          shapeFragments = getWavelet(indices);
          return null;
        }
        
    }
    else return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * This function returns the last fragment. Useful for completing the signal
 * @returns Returns the last fragment to complete the signal
 */
export function getShapeSegmentForce(){const sf = shapeFragments; shapeFragments = "";return sf;}

/**
 * Returns the signal segment dictionary
 * @param {int} dx Width of the time stamp
 * @param {int} dy height of the time stamp
 * @param {int} div Transision coefficient
 * @param {int} offsetUp Offset from base line upwards
 * @param {int} hScale Horizontal scale
 * @returns 
 */
function getDictionary(dx, dy, div, offsetUp, hScale)
{
  var dx1 = (Math.floor(0.5 * dx/div));
  var dx2 = (Math.floor(0.75 * dx/div));
  var dx3 = (dx*hScale - (dx1 + dx2));
  var bo = offsetUp;
  var dict = [   
                {x:0, y:bo+dy},             //p0
                {x:dx1, y:bo+dy}, 
                {x:dx1+dx2, y:bo+dy}, 
                {x:dx1+dx2+dx3, y:bo+dy}, 
                {x:dx1+dx2/2, y:bo+dy/2},   //p4
                {x:0, y:bo}, 
                {x:dx1, y:bo}, 
                {x:dx1+dx2, y:bo}, 
                {x:dx1+dx2+dx3, y:bo}, 
                {x:0, y:bo+dy/2}, 
                {x:dx1+dx2+dx3, y:bo+dy/2},
                {x:(dx1+dx2+dx3)/2, y:bo+dy}, 
                {x:(dx1+dx2+dx3)/2, y:bo}   //p12
            ];

  return dict;
}

/**
 * Returns path string for a given list of points on segment dictionary
 * @param {list} indices List of the indices to draw lines
 * @returns Path string from given point list
 */
function getWavelet(indices) {
  //console.log(offsetY);
  if (!LUT)throw new Error("LUT not initialized");
  const dictLen = LUT.length;
  const crispOffset = crisp ? 0.5 : 0;
  return indices
    .map((idx, i) => {
      const cmd = (i === 0) ? "M" : "L";
      if (idx >= dictLen)throw new Error("index exceeds dictionary length");
      return `${cmd}${offsetX+ crispOffset + LUT[idx].x} ${crispOffset + LUT[idx].y}`;
    })
    .join(" ");
  
}
