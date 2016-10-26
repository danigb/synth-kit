import { ac, isNum, toTime } from './utils'

function schedule (param, shape, times, types, context) {
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

export function env (shape, times, types, context) {
  var gain = (context || ac).createGain()
  gain.gain.value = 0
  gain.start = schedule(gain.gain, shape, times, types, context || ac)
  return gain
}

/**
 * An attack-hold-decay envelope
 */
export function ahd (attack, hold, decay, context) {
  if (!isNum(attack)) attack = 0.01
  if (!isNum(hold)) hold = 0
  if (!isNum(decay)) decay = 0.25
  return env([0, 1, 1, 0],
    [0, attack, hold, decay],
    ['set', 'lin', 'set', 'exp'], context)
}

/**
 * An attack-decay envelope
 */
export function perc (attack, decay, context) {
  return ahd(attack, 0, decay, context)
}
