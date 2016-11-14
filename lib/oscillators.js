/**
 * This module provides some syntactic sugar over the AudioContext.createOscillator
 * function
 *
 * @example
 * import { sine, square, master } from 'synth-kit'
 *
 * master.start(sine('A4'))
 * master.start(square({ note: 'c3', detune: -10 }))
 * @module oscillators
 */
import { noteToFreq, midiToFreq, tempoToFreq } from './units'
import { context } from './context'
import { mult } from './signals'
import { plug, lifecycle } from './routing'
import { OPTS, isA } from './utils'

// Create a OscillatorNode of the given type and configuration
// this is a private function intended to be partially applied
function create (type, opts) {
  opts = opts || OPTS
  type = type || opts.type
  var osc = context(opts.context).createOscillator()
  if (type) osc.type = type
  return lifecycle(osc, [
    plug('frequency', getFreq(opts), osc),
    plug('detune', opts.detune, osc)
  ])
}

// given a configuration object, get the frequency
export function getFreq (obj) {
  return obj.frequency ? obj.frequency
    : obj.freq ? obj.freq
    : obj.midi ? midiToFreq(obj.midi)
    : obj.note ? noteToFreq(obj.note)
    : isA('string', obj) ? noteToFreq(obj)
    : isA('number', obj) ? obj
    : null
}

/**
 * Create an oscillator (an OscillatorNode)
 *
 * @function
 * @param {Object} config - may include:
 *
 * - type: one of the OscillatorNode types
 * - frequency (or freq): the oscillator frequency (can be a signal)
 * - detune: the detune in cents (can be a signal)
 * - note: the note name to get the frequency from (if frequency is not present)
 * - midi: the note midi number to get the frequency from (if frequency is not present)
 * - context: the audio context to use
 *
 * Notice that instead of a config object, this function also accepts a note
 * name or a frequency value (see examples)
 *
 * @return {AudioNode} the oscillator
 * @example
 * // basic usage
 * osc({ type: 'sine', frequency: 880 })
 * osc({ note: 'C4', type: 'square', detune: -10 })
 * // parameter modulation
 * osc({ freq: 1500, detune: osc({ freq: 20}) })
 * osc({ freq: envelope(...), type: 'square' })
 * // without configuration object
 * osc('C4')
 * osc(1200)
 */
export const osc = create.bind(null, null)

/**
 * Create a sine oscillator. An alias for `osc({ type: 'sine', ... })`
 * @function
 * @see osc
 * @param {Object} config - Same as `osc` function, but without 'type'
 * @return {AudioNode} the oscillator
 * @example
 * sine('C4')
 * sine({ midi: 70, detune: -50 })
 */
export const sine = create.bind(null, 'sine')

/**
 * Create a sawtooth oscillator. An alias for `osc({ type: 'sawtooth', ... })`
 * @function
 * @see osc
 * @param {Object} config - Same as `osc` function, but without 'type'
 * @return {AudioNode} the oscillator
 * @example
 * saw('A3')
 * saw({ freq: 440, detune: lfo(5, 10) })
 */
export const saw = create.bind(null, 'sawtooth')
/**
 * Create a square oscillator. An alias for `osc({ type: 'square', ... })`
 * @function
 * @see osc
 * @param {Object} config - Same as `osc` function, but without 'type'
 * @return {AudioNode} the oscillator
 * @example
 * square({ note: 'c#3', context: offline() })
 */
export const square = create.bind(null, 'square')

/**
 * Create a triangle oscillator. An alias for `osc({ type: 'triangle', ... })`
 * @function
 * @see osc
 * @param {Object} config - Same as `osc` function, but without 'type'
 * @return {AudioNode} the oscillator
 * @example
 * triangle({ note: 'Bb4', detune: -10 })
 */
export const triangle = osc.bind(null, 'triangle')

/**
 * Create an LFO (low frequency oscillator). It's a standard oscillator with
 * some goodies to reduce the boilerplate code when used as signal modulator.
 *
 * @see osc
 * @param {Options} config - May include any of the `osc` function plus:
 *
 * - tempo: the tempo used to calculate the frequency (it overrides the frequency parameter)
 * - division: the number of subdivisions of the tempo (defaults to 1)
 * - amplitude: the amplitude of the oscillator
 *
 * @example
 * sine({ note: 'C4', detune: lfo({ freq: 5, amplitude: 50 }) })
 * sine({ note: 'A4', detune: lfo({ amplitude: 10, tempo: 120, division: 3 })
 */
export function lfo (opts) {
  opts = opts || OPTS
  var node = osc(opts)
  if (opts.tempo) node.frequency.value = tempoToFreq(opts.tempo, opts.division)
  return mult(opts.amplitude || 1, node)
}
