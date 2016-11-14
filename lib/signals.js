/** @module signals */

import { OPTS, isA } from './utils'
import { context } from './context'
import { add, conn, lifecycle, plug } from './routing'
import { dBToGain, levelToGain } from './units'

/**
 * Create a GainNode
 *
 * @param {Object} config - may include:
 *
 * - value (or gain): the gain (can be a number or a signal)
 * - dB (or db): the gain in dB (only if gain is not specified)
 * - level: the gain in a logaritmic scale from 0 to 100
 * - context: the audio context to use to create the signal
 *
 * This funcion accepts a number with the gain value instead of a config object.
 *
 * @return {AudioNode} a GainNode
 * @example
 * gain({ dB: -3, context: <AudioContext> })
 * // with modulation (kind of tremolo)
 * conn(sine(400), gain({ value: sine(10) }))
 * // passing a number instead of an object
 * conn(sine('C4'), gain(0.3))
 */
export function gain (opts) {
  opts = opts || OPTS
  var node = context(opts.context).createGain()
  return lifecycle(node, [
    plug('gain', getGain(opts), node)
  ])
}

// given an config object, return the gain
function getGain (opts) {
  return isA('number', opts) ? opts
    : opts.value ? opts.value
    : opts.gain ? opts.gain
    : isA('number', opts.dB) ? dBToGain(opts.dB)
    : isA('number', opts.db) ? dBToGain(opts.db)
    : isA('number', opts.level) ? levelToGain(opts.level)
    : null
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
 * @param {Object} config - may include:
 *
 * - context: the audio context to use
 *
 * @return {AudioNode} the bypass audio node
 * @example
 * conn(sine('C4'), add(bypass(), dly(0.2)))
 */
export function bypass (o) {
  return context(o ? o.context : null).createGain()
}

/**
 * Multiply a signal.
 *
 * @param {Integer} value - the value
 * @param {Integer|AudioNode} signal - the signal to multiply by
 * @example
 * // a vibrato effect
 * sine(440, { detune: mult(500, sine(2)) })
 */
export function mult (value, signal) {
  if (isA('number', signal)) return value * signal
  return conn(signal, gain({ value: value, context: signal.context }))
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
