/** @module filters */
import { context } from './context'
import { plug, lifecycle } from './routing'
var OPTS = {}

/**
 * Create a filter (a [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode))
 *
 * @param {String} type - the filter [type](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type)
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) options may include:
 *
 * - detune: the detune of the frequency in cents (can be a number or a signal)
 * - Q: the Q of the filter (can be a number or a signal)
 * - context: the audio context to use
 *
 * @return {AudioNode} the filter
 * @example
 * connect(square(800), filter('lowpass', 400))
 */
export function filter (type, frequency, o) {
  o = o || OPTS
  var filter = context(o).createBiquadFilter()
  filter.type = type || 'lowpass'
  return lifecycle(filter, [
    plug('frequency', frequency, filter),
    plug('Q', o.Q, filter),
    plug('detune', o.detune, filter)
  ])
}

/**
 * Create a lowpass filter. An alias for `filter('lowpass', ...)`
 *
 * @function
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) the same options as `filter` function
 * @return {AudioNode} the lowpass filter
 * @example
 * connect(square(800), lowpass(400))
 * @see filter
 */
export const lowpass = filter.bind(null, 'lowpass')

/**
 * Create a hipass filter. An alias for `filter('hipass', ...)`
 *
 * @function
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) the same options as `filter` function
 * @return {AudioNode} the hipass filter
 * @example
 * connect(square(800), hipass(400))
 * @see filter
 */
export const hipass = filter.bind(null, 'highpass')

/**
 * Create a bandpass filter. An alias for `filter('bandpass', ...)`
 *
 * @function
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) the same options as `filter` function
 * @return {AudioNode} the bandpass filter
 * @example
 * connect(square(800), bandpass(400))
 * @see filter
 */
export const bandpass = filter.bind(null, 'hipass')
