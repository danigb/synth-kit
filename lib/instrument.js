import { contextOf, when, dest } from './context'
import { isFn, isObj } from './utils'
var slice = Array.prototype.slice

/**
 * @example
 * var synth = withNotes((fq) => return sine(fq))
 * synth('A4') // => play a 440Hz sound
 * synth(60) // => same as: play('C4')
 */
export function withNotes (fn) {
  return function () {

  }
}

/**
 * @example
 * var synth = withOptions(function (o) {
 *    return connect(sine(o.frequency),
 *      filter(o.filter.type, o.filter.frequency || o.frequency))
 * }, { frequency: 440, filter: { type: 'lowpass' }}, ['frequency'])
 * synth({ frequency: 'A4' })
 * synth('A4')
 */
export function withOptions (fn, config) {
  config = config || {}
  config.toOptions = config.toOptions || freqAndContextToOpts
  return function (options) {
    if (!isObj(options)) options = config.toOptions.apply(null, arguments)
    return fn(Object.assign({}, config.defaults, options))
  }
}
function freqAndContextToOpts (frequency, context) {
  return { frequency: frequency, context: context }
}

/**
 * A master output instrument. You can start nodes with it
 *
 * @example
 * master.start(sine(300))
 */
export var master = inst(null, dest())

/**
 * @example
 * // an instrument with destination
 * var synth = inst((fq) => sine(fq), dest())
 * synth.start('A4')
 * synth.stopAll()
 * @example
 * // only the destination
 * var master = inst(null, connect(mix(0.2), reverb(), dest()))
 * master.start(sine(300))
 * master.start(sine(400))
 * master.stopAll()
 */
export function inst (synth, destination, maxVoices) {
  var i = {}
  var voices = initVoices(maxVoices)
  i.start = function (value, time, delay, duration) {
    var node = isFn(synth) ? synth(value) : value
    if (destination) node.connect(destination)

    trackNode(voices, node)
    time = when(time, delay, contextOf(destination))
    node.start(time)
    if (duration) node.stop(time + duration)
    return node
  }
  i.stop = function () { return stopAll(voices) }
  i.inst = function (synth, maxVoices) { return inst(synth, destination, maxVoices) }
  i.on = on.bind(null, i)
  i.trigger = trigger.bind(null, i)
  return i
}

function initVoices (limit) {
  limit = limit || 0
  return { limit: limit, all: {}, nextId: 0, current: 0, pool: new Array(limit) }
}
function trackNode (voices, node) {
  node.id = voices.nextId++
  voices.all[node.id] = node
  return voices
}
function stopAll (voices) {
  Object.keys(voices.all).forEach(function (id) {
    voices.all[id].stop()
  })
}

export function on (target, event, callback) {
  if (!event || event === '*') event = 'event'
  var prev = target['on' + event]
  target['on' + event] = function () {
    if (prev) prev.apply(null, arguments)
    callback.apply(null, arguments)
  }
}

export function trigger (target, event /*, ...values */) {
  if (!isFn(target['on' + event])) return
  var args = slice.call(arguments, 2)
  target['on' + event].apply(null, args)
  if (isFn(target.onevent)) target.onevent.apply(null, args)
}
