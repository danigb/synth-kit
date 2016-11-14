/** @module effects */
import { context, samplingRate } from './context'
import { add, conn, plug, lifecycle } from './routing'
import { bypass, gain } from './signals'
import { isA, OPTS } from './utils'
import { osc } from './oscillators'
import { lowpass } from './filters'
import { gen, white } from './buffers'

/**
 * Mix an effect with the signal. Can be partially applied to create an
 * effect bus.
 * @param {Number} wet - the amount of effect (0-1)
 * @param {AudioNode} fx - the effect unit
 * @param {Object} options - (Optional) may include:
 *
 * - compensate: it it's false, the dry signal gain will pass without reduction.
 * If true (it's true by default) the dry signal is reduced the gain of the wet signal.
 * - context: the audio context
 *
 * @return {AudioNode}
 * @example
 * mix(dB(-3), delay(ms(800)))
 * @example
 * // create an effect bus
 * var rev = mix(reverb(2))
 * conn(sine(300), rev(0.2))
 */
export function mix (wet, fx, opts) {
  if (arguments.length === 1) return function (w, o) { return mix(w, wet, o) }
  if (!isA('number', wet)) wet = 0.5
  opts = opts || OPTS
  var dry = opts.compensate === false ? 1 : 1 - wet
  console.log('MIX', wet, dry, opts)
  return add(gain(dry), conn(fx, gain(wet)))
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
  node.conn(feed)
  feed.conn(node)
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
export function dly (time, opts) {
  opts = opts || OPTS
  var dly = context(opts.context).createDelay(5)
  return lifecycle(dly, [
    plug('delayTime', time, dly)
  ])
}

/**
 * Create a convolver
 * @param {AudioBuffer} buffer
 * @param {Object} options - (Optional) options may include:
 *
 * - normalize: true to normalize the buffer
 * - context: the audio context to use
 *
 * @return {AudioNode} the convolver (ConvolverNode)
 * @example
 * reverb = mix(convolve(sample('emt-140.wav')))
 * connect(subtractive(880, { perc: [0.1, 1] }), reverb(0.2))
 */
export function convolve (buffer, o) {
  o = o || OPTS
  var c = context(o.context).createConvolver()
  c.buffer = isA('function', buffer) ? buffer() : buffer
  if (o.normalize === true) c.normalize = true
  return c
}

/**
 * Create a reverb impulse response using a logarithmic decay white noise
 * @param {Number} duration - the duration in samples
 * @param {Object} options - (Optional) options may include:
 *
 * - decay: the decay length in samples
 * - attack: the attack time in samples
 * - reverse: get the reversed impulse
 * - context: the context to use
 *
 * @return {AudioBuffer} the impulse response audio buffer
 */
export function decayIR (samples, opts) {
  samples = samples || 10000
  opts = opts || OPTS
  var attack = opts.attack || Math.floor(samples / 10)
  var decay = opts.decay || samples - attack
  // 60dB is a factor of 1 million in power, or 1000 in amplitude.
  var base = Math.pow(1 / 1000, 1 / decay)
  return gen(function (i) {
    var dec = base ? Math.pow(base, i) : 1
    var att = i < attack ? (i / attack) : 1
    return att * white.generator(i) * dec
  }, samples, opts)
}

/**
 * Create a simple reverb
 * @param {Number} duration - in seconds? WTF?
 */
export function reverb (duration, opts) {
  opts = opts || OPTS
  var rate = samplingRate(opts.context)
  return convolve(decayIR(duration * rate, opts), opts)
}

/**
 * A mono or stereo delay with filtered feedback
 */
export function delay (time, filter, feedAmount, ac) {
  if (!isA('number', feedAmount)) feedAmount = 0.3
  filter = isA('number', filter) ? lowpass(filter, null, null, ac) : filter || bypass(ac)
  return feedback(feedAmount, dly(time, ac), filter, ac)
}
