/** @module effects */
import { context } from './context'
import { add, connect, plug, lifecycle } from './routing'
import { bypass, gain } from './signals'
import { isA } from './units'
import { osc } from './oscillators'
import { lowpass } from './filters'

/**
 * Mix an effect with the signal. Can be partially applied to create an
 * effect bus.
 * @param {Number} wet - the amount of effect (0-1)
 * @param {AudioNode} fx - the effect unit
 * @return {AudioNode}
 * @example
 * mix(dB(-3), delay(ms(800)))
 * @example
 * // create an effect bus
 * var fxs = mix(connect(reverb(0.1), delay([ms(20), ms(21)])))
 * connect(sine(300), fxs(0.2))
 */
export function mix (fx, wet, norm) {
  if (arguments.length === 1) return function (w, n) { return mix(fx, w, n) }
  if (!isA('number', wet)) wet = 0.5
  var dry = norm === false ? 1 : 1 - wet
  return add(gain(dry), connect(fx, gain(wet)))
}

/**
 * Create a feedback loop.
 * @param {Integer} amount - the amount of signal
 * @param {AudioNode} node - the node to feedback
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use
 *
 * @return {AudioNode} the original node (with a feedback loop)
 */
export function feedback (amount, node, options) {
  var feed = gain(amount, options)
  node.connect(feed)
  feed.connect(node)
  return node
}

/**
 * Create a tremolo
 */
export function tremolo (rate, type, ac) {
  type = type || 'sine'
  return gain(osc(type, rate, ac), ac)
}

/**
 * Create a delay (a DelayNode object)
 */
export function dly (time, ac) {
  var dly = context(ac).createDelay(5)
  return lifecycle(dly, [
    plug('delayTime', time, dly)
  ])
}

/**
 * A mono or stereo delay with filtered feedback
 */
export function delay (time, filter, feedAmount, ac) {
  if (!isA('number', feedAmount)) feedAmount = 0.3
  filter = isA('number', filter) ? lowpass(filter, null, null, ac) : filter || bypass(ac)
  return feedback(feedAmount, dly(time, ac), filter, ac)
}
