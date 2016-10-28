import { context } from './context'
import { isNum, plug, lifecycle } from './utils'
import { add, connect, osc, bypass, gain, lowpass } from './core'

export function mix (wet, fx) {
  if (!isNum(wet)) wet = 0.5
  return add(gain(1 - 0.5), connect(fx, gain(wet)))
}

export function bus (fx) {
  return function (wet) { return mix(wet, fx) }
}

/**
 * Create a feedback loop.
 * @param {Integer} amount - the amount of signal
 * @param {AudioNode} node - the node to feedback
 * @param {AudioNode} ret - (Optional) the return fx
 * @param {AudioContext} context - (Optional) the audio context
 */
export function feedback (amount, signal, fx, ac) {
  fx = fx || bypass(ac)
  var feed = gain(amount, ac)
  connect(fx, signal, feed)
  feed.connect(fx)
  return signal
}

export function tremolo (rate, type, ac) {
  type = type || 'sine'
  return gain(osc(type, rate, ac), ac)
}

export function dly (time, ac) {
  var dly = context(ac).createDelay(5)
  return lifecycle(dly, [
    plug('delayTime', time, dly)
  ])
}

export function delay (time, filter, feedAmount, ac) {
  if (!isNum(feedAmount)) feedAmount = 0.3
  filter = isNum(filter) ? lowpass(filter, null, null, ac) : filter || bypass(ac)
  return feedback(feedAmount, dly(time, ac), filter, ac)
}
