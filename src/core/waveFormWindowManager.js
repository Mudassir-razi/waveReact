// const testFile = [
//     {name: "sig1", wave : "1..0."},
//     {name: "sig1", wave : "1..0."},
//     {name: "sig1", wave : "1..0."},
//     ['group1',  {name: "sig1", wave : "1..0."},
//                 {name: "sig1", wave : "1..0."},
//                 {name: "sig1", wave : "1..0."},
//                 ['group11', {name: "sig1", wave : "1..0."},
//                             {name: "sig1", wave : "1..0."},
//                 ]
//     ],
//     ['group2',  {name: "sig1", wave : "1..0."},
//                 {name: "sig1", wave : "1..0."},
//     ]
// ];


var hierList = [];
var signalNameList = [];
var flatLine = 0;
var maxDepth = 0;
var maxNameLength = 0;

/**
 * Extractes bracket information (text, start, end, depth) from signals
 * @param {List } signals signal list
 * @returns list of group bracket parameters
 */
export function getHierarchy(signals)
{
    hierList = [];
    signalNameList = [];
    flatLine = 0;
    maxDepth = 0;
    maxNameLength = 0;
    configureHierarchy(signals);
    return hierList;
}

//Returns various important parameters regarding name divider
export function getSignalNames() {return signalNameList};
export function getMaxLevel(){return maxDepth;}
export function getMaxNameLength(){return maxNameLength;}

/**
 * Returns the maximum length of the wave in the signal list
 * @param {List } flatSignal flat signal list
 */
export function getMaxWaveLength(flatSignal)
{
    var maxLen = 0;
    for(var i = 0;i < flatSignal.length;i++)
    {
        const signal = flatSignal[i];
        if(Object.keys(signal).length === 0)continue;
        maxLen = max(maxLen, signal.wave.length);
    }
    return maxLen;
}

function configureHierarchy(signals, level=0)
{
    const len = signals.length;
    maxDepth = max(maxDepth, level);
    for(var i = 0;i < len;i++)
    {
        const signal = signals[i];
        if(Array.isArray(signal))
        {
            const groupName = typeof signal[0] === 'string' ? signal[0] : " ";
            let newInstance = {text : groupName , start : flatLine, end : flatLine, level : level+1};
            configureHierarchy(signal, level+1);
            newInstance.end = flatLine-1;
            hierList.push(newInstance);
        }
        else if(typeof signal === 'object'){
            if(Object.keys(signal).length !== 0){
                signalNameList.push(signal.name);
                maxNameLength = max(maxNameLength, signal.name.length);
            }
            //if it's empty signal, just put empty space
            else signalNameList.push(" ");
            
            flatLine++;
        }
    }
}


export function standardizeSignal(signals)
{
    var i;
    var standardSignal = [];
    for(i = 0; i < signals.length; i++){
        if(typeof signals[i] === "object" &&
            signals[i]  !== null &&
            Object.keys(signals[i]).length === 0 &&
            signals[i].constructor === Object)
            {
                standardSignal.push({});
                continue;
            } 
        else {
            var name = Object.keys(signals[i]).includes("phase") ? signals[i].name : " ";
            var phase = Object.keys(signals[i]).includes("phase") ? parseInt(signals[i].phase) : 0;
            var signal = Object.keys(signals[i]).includes("wave") ? expandWavePattern(signals[i].wave) : " ";
            var data = Object.keys(signals[i]).includes("data") ? expandDataPatterns(signals[i].data) : " ";
            var lineWidth = Object.keys(signals[i]).includes("width") ? parseInt(signals[i].width) : 1;
            var scale = Object.keys(signals[i]).includes("scale") && signals[i].scale !== " " && signals[i].scale !== ""?  signals[i].scale : 1;

            const phaseActual = isNaN(phase) ? 0 : ( phase > 10 ? 10 : (phase < -10 ? -10 : phase));
            const newSignal = {name : name, wave : signal, data : data, scale : scale, phase : phaseActual, width : lineWidth};
            standardSignal.push(newSignal);
        }
        
      }
      return standardSignal;
}

/**
 * Expands pattern of the data key depending on the code pattern.
 * First letter: u -> up-count, d -> down-count. Second letter: d -> decimal, b -> binary, h -> hexa. So, ux is upcount in hexadecimal.
 * ud(1, 4) -> 1 2 3 4. ud(1, 4, 2) -> 1 3 5 7 
 * @param {string} input Input code string in the data key of the waveform
 * @returns {string} Expanded version of the short code in the data key
 */
function expandDataPatterns(input) {
  // Match prefix, mode, arguments, suffix
  return input.replace(/(\S*?)(ud|ub|ux|dd|db|dx)\(([^)]*)\)(\S*)/gi,
    (_, prefix, mode, args, suffix) => {
      let [startStr, countStr, stepStr] = args.split(',').map(s => s.trim());
      const s = parseInt(startStr);
      const c = parseInt(countStr);
      const step = stepStr !== undefined ? parseInt(stepStr) : 1;

      const up = mode.startsWith('u');
      const bin = mode.endsWith('b');
      const hex = mode.endsWith('x');

      let result = [];
      for (let i = 0; i < c; i++) {
        let value = up ? s + i * step : s - i * step;

        if (bin) {
          value = value.toString(2);
        } else if (hex) {
          value = value.toString(16).toUpperCase();
        } else {
          value = value.toString();
        }

        result.push(`${prefix}${value}${suffix}`);
      }
      return result.join(' ');
    }
  );
}

/**
 * expands patterns liike (a, 3) to aaa
 * @param {string} input Input code string from the wave key of the waveform
*/
function expandWavePattern(input) {
  return input.replace(/\(([^,]+),\s*(\d+)\)/g, (_, pattern, count) => {
    return pattern.repeat(parseInt(count));
  });
}

function max(a, b){ return a > b ? a : b;}

