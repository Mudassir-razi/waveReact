import { flattenSignals } from "./parser";
import { expandWavePattern } from "./waveFormWindowManager";

export function modifyOnMouseEvent(signals, timeStamp, signalIdx, timeStampPrev, signalIdxPrev, action) {
    if (signalIdx !== signalIdxPrev) {
        return signals;
    }

    const flatSignals = flattenSignals(signals);
    const currentSignal = flatSignals[signalIdx];
    const splittedWave = expandWavePattern(currentSignal.wave).split(' '); 
    const currentWave = splittedWave[0];
    const complimentaryWave = splittedWave.length === 2 ? " "+ splittedWave[1] : "";

    let newWave = currentWave;

    if (timeStampPrev === timeStamp) {

        // Single click
        if(action === 'erase')
        {

        }
        
        else if(timeStamp < currentWave.length){
            const currentSymbol = getEffectiveSymbol(currentWave, timeStamp);
            const newVal = currentSymbol === action ? currentSymbol : action;
            newWave = setRange(currentWave, timeStamp, timeStamp, newVal); 
        }
        else{
            //extend the signal
            const dot = ".";
            newWave = currentWave + dot.repeat(timeStamp-currentWave.length+1);
        }
    } else {
        // Click and drag
        const val = getEffectiveSymbol(currentWave, timeStampPrev);
        const start = Math.min(timeStampPrev, timeStamp);
        const end = Math.max(timeStampPrev, timeStamp);
        newWave = setRange(currentWave, start, end, val);

    }

    return updateSignalAtIndex(structuredClone(signals), signalIdx, newWave+complimentaryWave);
}

// ─── Core helpers ────────────────────────────────────────────────

/**
 * Expand compressed wave to one character per time slot.
 * "1..0." → "11100"
 */
function expandWave(wave) {
    if (!wave) return '';
    let result = '';
    let last = ' ';
    for (const ch of wave) {
        if (ch === '.') {
            result += last;
        } else {
            result += ch;
            last = ch;
        }
    }
    return result;
}

/**
 * Compress an expanded wave back to WaveDrom shorthand.
 * Expands first so it is safe to pass either form.
 * By construction, same-value transitions (glitches) cannot survive.
 */
function compressWave(wave) {
    if (!wave) return '';
    const expanded = expandWave(wave); // normalise — dots become actual values
    let result = '';
    let lastEmitted = null;
    for (const ch of expanded) {
        if (ch === lastEmitted) {
            result += '.';
        } else {
            result += ch;
            lastEmitted = ch;
        }
    }
    return result;
}

/**
 * Return the effective symbol at a given index in a compressed wave.
 * Walks left through dots to find the owning symbol.
 */
function getEffectiveSymbol(wave, index) {
    if (index < 0 || index >= wave.length) return null;
    if (wave[index] !== '.') return wave[index];
    for (let i = index - 1; i >= 0; i--) {
        if (wave[i] !== '.') return wave[i];
    }
    return null;
}

/**
 * Set every slot in [start, end] (inclusive, 0-indexed) to val,
 * then recompress. Works in expanded space so both left and right
 * boundary glitches are eliminated automatically.
 */
function setRange(wave, start, end, val) {
    const expanded = expandWave(wave);
    if (start > end || start < 0 || end >= expanded.length) return wave;

    const arr = expanded.split('');
    for (let i = start; i <= end; i++) arr[i] = val;
    return compressWave(arr.join(''));
}

// ─── Unchanged ───────────────────────────────────────────────────

function updateSignalAtIndex(updatedSignals, signalIdx, newWaveform, count = -1) {
    for (let i = 0; i < updatedSignals.length; i++) {
        if (Array.isArray(updatedSignals[i])) {
            updatedSignals[i] = updateSignalAtIndex(updatedSignals[i], signalIdx, newWaveform, count);
        } else {
            count++;
            if (count === signalIdx) {
                updatedSignals[i].wave = newWaveform;
            }
        }
    }
    return updatedSignals;
}
