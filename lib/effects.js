import { ac, isNum, plug, lifecycle } from './utils'
import { add, connect, osc, gain } from './core'

export function mix (wet, fx) {
  if (!isNum(wet)) wet = 0.5
  return add(gain(1 - 0.5), connect(fx, gain(wet)))
}

export function tremolo (rate, type, ctx) {
  type = type || 'sine'
  return gain(osc(type, rate, ctx), ctx)
}

export function dly (time, context) {
  var dly = (context || ac).createDelay(5)
  return lifecycle(dly, [
    plug('delayTime', time, dly)
  ])
}
