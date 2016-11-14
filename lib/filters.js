/**
 * This module provides some syntactic sugar over the AudioContext.createBiquadFilter
 * function.
 *
 * @example
 * import { conn, square, lowpass, filter, master } from 'synth-kit'
 *
 * master.start(conn(square('C4'), lowpass('C5')))
 * master.start(conn(square('A4'), filter({ type: 'hipass', Q: 10, freq: 1000 }))
 * @module filters
 */
import { OPTS } from './utils'
import { getFreq } from './oscillators'
import { context } from './context'
import { plug, lifecycle } from './routing'

// private: create a filter
function create (type, opts) {
  opts = opts || OPTS
  var filter = context(opts.context).createBiquadFilter()
  filter.type = type || opts.type || 'lowpass'
  return lifecycle(filter, [
    plug('frequency', getFreq(opts), filter),
    plug('Q', opts.Q, filter),
    plug('detune', opts.detune, filter)
  ])
}

/**
 * Create a filter (a [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode))
 *
 * @function
 * @param {Object} config - it may include:
 *
 * - frequency (or freq, or note or midi): the frequency expressed in hertzs
 * (or midi note number or note name)
 * - type: one of the BiquadFilterNode types
 * - detune: the detune of the frequency in cents (can be a number or a signal)
 * - Q: the Q of the filter (can be a number or a signal)
 * - context: the audio context to use
 *
 * Instead of a configuration object you can pass a frequency number of note
 * name just to specify the frequency.
 *
 * @return {AudioNode} the BiquadFilterNode
 * @example
 * conn(square(800), filter({ type: 'lowpass', freq: 600 }))
 */
export var filter = create.bind(null, null)

/**
 * Create a lowpass filter. An alias for `filter({ type: 'lowpass', ... })`
 *
 * @function
 * @param {Object} config - same as `filter` function but without type
 * @return {AudioNode} the lowpass filter
 * @see filter
 * @example
 * conn(square('C4'), lowpass(400))
 */
export const lowpass = create.bind(null, 'lowpass')

/**
 * Create a hipass filter. An alias for `filter({ type: 'hipass', ... })`
 *
 * @function
 * @param {Object} config - same as `filter` function but without type
 * @return {AudioNode} the hipass filter
 * @see filter
 * @example
 * conn(square(800), hipass(400))
 */
export const hipass = create.bind(null, 'highpass')

/**
 * Create a bandpass filter. An alias for `filter({ type: 'bandpass', ... })`
 *
 * @function
 * @param {Object} config - same as `filter` function but without type
 * @return {AudioNode} the bandpass filter
 * @see filter
 * @example
 * conn(square(800), bandpass(400))
 */
export const bandpass = create.bind(null, 'hipass')
