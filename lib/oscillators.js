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
import { gain, mult } from './signals'
import { conn, add, plug, lifecycle } from './routing'
import { OPTS, toArr } from './utils'

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
 * Create an oscillator bank. It returns a signal composed of the sum of the
 * individual oscillators.
 *
 * @param {Array<Float>} frequencies - an array with the frequencies
 * @param {Object} options - (Optional) options can include:
 *
 * - frequency: if provided, the frequencies will be multiplied by this value
 * - types: a value or an array of oscillator types. If the array is shorter
 * than the frequencies array, it's assumed to be circular.
 * - gains: a value or an array of gain values. If the array is shorter
 * than the frequencies array, it's assumed to be circular.
 *
 * @return {AudioNode}
 *
 * @example
 * // create three sines with unrelated frequencies:
 * oscBank([1345.387, 435.392, 899.432])
 * // create three sawtooth with related frequencies:
 * oscBank([ 1, 2, 2.4 ], { frequency: 400, types: 'sawtooth' })
 * // create two squares of 400 and 800 and two sawtooths of 600 and 1200
 * // (the types are cyclic)
 * oscBank([400, 600, 800, 1200], { types: ['square', 'sawtooth'] })
 * // specify gains
 * oscBank([440, 660], { gains: [0.6, 0.2] })
 */
export function oscBank (freqs, opts) {
  if (!opts) opts = OPTS
  var base = opts.frequency || 1
  var gains = toArr(opts.gains || 1)
  var types = toArr(opts.types || 'sine')
  var N = opts.normalize === false ? 1 : freqs.length

  var tl = types.length
  var gl = gains.length
  return conn(add(freqs.map(function (freq, i) {
    var src = osc(types[i % tl], base * freq)
    var g = gains[i % gl]
    return g === 1 ? src : conn(src, gain(g))
  })), gain(1 / N))
}

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
