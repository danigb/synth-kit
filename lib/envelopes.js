import { context } from './context'
import { isNum, toTime } from './utils'

function schedule (param, shape, times, types, ac) {
  return function (when, delay) {
    console.log(shape, times, types)
    var type
    var time = toTime(context, when, delay)
    var lt = times.length
    var tp = types.length
    shape.forEach(function (value, i) {
      time += times[i % lt]
      type = types[i % tp]
      console.log(value, time, type)
      if (type === 'set') param.setValueAtTime(value, time)
      else if (type === 'exp') param.exponentialRampToValueAtTime(value === 0 ? 0.00001 : value, time)
      else param.linearRampToValueAtTime(value, time)
    })
  }
}

export function env (shape, times, types, ac) {
  var ctx = context(ac)
  var gain = ctx.createGain()
  gain.gain.value = 0
  gain.start = schedule(gain.gain, shape, times, types, ctx)
  return gain
}

function toNum (num, def) { return isNum(num) ? num : def }
/**
 * An attack-decay-sustain-(hold)-decay envelope
 */
export function adshr (attack, decay, sustain, hold, release, ac) {
  attack = toNum(attack, 0.01)
  decay = toNum(decay, 0.1)
  sustain = toNum(sustain, 1)
  hold = toNum(hold, 0)
  release = toNum(release, 0.3)
  return env([0, 1, sustain, sustain, 0],
    [0, attack, decay, hold, release],
    ['set', 'lin', 'set', 'exp'], ac)
}

/**
 * An attack-decay envelope
 */
export function perc (attack, decay, ac) {
  return adshr(attack, 0, 1, 0, decay, ac)
}
