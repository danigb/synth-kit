/**
 * This module provides a concise API over the AudioContext's createOscillator
 * function
 * @example
 * import { sine, lfo, Hz, master } from 'synth-kit'
 *
 * master.start(sine(Hz('A4'), { detune: lfo(5, 10) }))
 * @module oscillators
 */
import { tempo } from './units'
import { context } from './context'
import { mult } from './signals'
import { plug, lifecycle } from './routing'
import { OPTS } from './utils'

/**
 * Create an oscillator (an OscillatorNode)
 * @param {String} type - one of OscillatorNode [types]()
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) Options can include:
 *
 * - detune: the detune in cents. Can be a number or a signal (see example)
 * - context: the audio context to use
 *
 * @return {AudioNode} the oscillator
 * @example
 * osc('sine', 880)
 * osc('square', 880, { detune: -10 })
 * osc('sawtooth', 1600, { detune: lfo(5, 50) }
 * // any signal can be the detune modulator
 * osc('sawtooth', 1600, { detune: conn(...) }
 */
export function osc (type, frequency, o) {
  if (!o) o = OPTS
  var osc = context(o.context).createOscillator()
  osc.type = type || 'sine'
  return lifecycle(osc, [
    plug('frequency', frequency, osc),
    plug('detune', o.detune, osc)
  ])
}
/**
 * Create a sine oscillator. An alias for `osc('sine', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} frequency - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * sine(1760)
 * sine(800, { detune: -50 })
 */
export const sine = osc.bind(null, 'sine')
/**
 * Create a sawtooth oscillator. An alias for `osc('sawtooth', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * saw(1760)
 * saw(440, { detune: lfo(5, 10) })
 */
export const saw = osc.bind(null, 'sawtooth')
/**
 * Create a square oscillator. An alias for `osc('square', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * square(1760, { context: offline() })
 */
export const square = osc.bind(null, 'square')
/**
 * Create a triangle oscillator. An alias for `osc('triangle', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * triangle(1760, { detune: -10 })
 */
export const triangle = osc.bind(null, 'triangle')

/**
 * Create a lfo. It's a decorated oscillator with some goodies to reduce
 * the boilerplate code with signal modulators
 *
 * @param {Integer} freq - the frequency
 * @param {Integer} amplitude - the amplitude
 * @param {Options} options - (Optional) Options can include:
 *
 * - context: the audio context to be used
 * - tempo: if provided, the freq parameter is the number of beats inside that tempo
 *
 * @example
 * master.start(sine(300, { detune: lfo(5, 10) }))
 * // too complicated?
 * master.start(sine(300, { detune: lfo(4, 10, { tempo: 120 }))
 */
export function lfo (freq, amp, o) {
  freq = freq || 7
  amp = amp || 1
  o = o || OPTS
  if (o.tempo) freq = tempo(o.tempo, freq)
  return mult(amp, osc(o.type || 'sine', freq))
}
