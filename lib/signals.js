/** @module signals */

import { isA } from './utils'
import { context } from './context'
import { add, conn, lifecycle, plug } from './routing'

/**
 * Create a gain node
 * @param {Float|AudioNode} gain - the gain value or modulator
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @return {AudioNode} the gain node
 * @example
 * conn(sine(440), gain(0.3))
 * @example
 * // with modulation (kind of tremolo)
 * conn(sine(400), gain(sine(10)))
 * @example
 * using a configuration object
 * gain({ gain: 0.5, context: <AudioContext> })
 */
export function gain (gain, opts) {
  if (arguments.length === 1 && !isA('number', gain)) return gain(gain.gain, gain)
  var node = context(opts ? opts.context : null).createGain()
  return lifecycle(node, [
    plug('gain', gain, node)
  ])
}

/**
 * Create a constant signal. Normally you will use it in combination with
 * envelopes or modulators.
 *
 * @param {Integer} value - the value of the constant
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @return {AudioNode} the constant audio node
 * @example
 * sine(constant(440)).start()
 */
export function constant (value, o) {
  // TODO: cache buffer
  var ctx = context(o ? o.context : null)
  var source = ctx.createBufferSource()
  source.loop = true
  source.buffer = ctx.createBuffer(1, 2, ctx.sampleRate)
  var data = source.buffer.getChannelData(0)
  data[0] = data[1] = value
  return source
}

/**
 * Create a signal source. You will use signals to change parameters of a
 * audio node after starting. See example.
 * @param {Integer} value - the value of the constant
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @return {AudioParam} the constant audio node
 * @example
 * var freq = signal(440)
 * sine(freq).start()
 * freq.value.linearRampToValueAtTime(880, after(5))
 */
export function signal (value, opts) {
  var signal = gain(value, opts)
  conn(constant(1, opts), signal).start()
  signal.signal = signal.gain
  return signal
}

/**
 * Create a node that bypasses the signal
 * @param {AudioContext} context - (Optional) the audio context
 * @return {AudioNode} the bypass audio node
 * @example
 * conn(sine(300), add(bypass(), dly(0.2)))
 */
export function bypass (o) {
  return context(o ? o.context : null).createGain()
}

/**
 * Multiply a signal.
 * @param {Integer|AudioNode} value - the value
 * @param {AudioNode} signal - the signal to multiply by
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @example
 * // a vibrato effect
 * sine(440, { detune: mult(500, sine(tempo(160))) })
 */
export function mult (value, signal, opts) {
  if (isA('number', signal)) return value * signal
  return conn(signal, gain(value, opts))
}

/**
 * Scale a signal. Given a signal (between -1 and 1) scale it to fit in a range.
 * @param {Integer} min - the minimum of the range
 * @param {Integer} max - the minimum of the range
 * @param {AudioNode} source - the signal to scale
 * @return {AudioNode} the scaled signal node
 * @example
 * // create a frequency envelope between 440 and 880 Hz
 * sine(scale(440, 880, adsr(0.1, 0.01, 1, 1)))
 */
export function scale (min, max, source) {
  var ctx = source
  if (source.numberOfInputs) source = conn(constant(1, ctx), source)
  var delta = max - min
  return add(constant(min, ctx), mult(delta, source))
}
