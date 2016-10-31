/** @module instrument */
import { isA, OPTS, toArr, slice } from './utils'
import { context, when, dest } from './context'
import { withDest } from './synth'

/**
 * A master output instrument. You can use it to start and stop nodes. All
 * started nodes will be connected to the AudioContext destination.
 *
 * @example
 * master.start(sine(300)) // connect to destination and start
 * master.start(sine(600), 0, 1) // connect to destination and start after 1 second
 * master.stop() // stop all
 */
export var master = inst(null, dest())

/**
 * Create an object-oriented-style instrument player. It wraps a synth function
 * (a function that create nodes) into in a convenient player API. It can
 * be used to limit the polyphony.
 *
 * The player object have the following methods:
 *
 * - `start(node, when, delay, duration)`: start a node
 * - `stop`: stop all nodes
 * - `on(name, callback)`: add an event callback
 * - `event(name, ...values)`: fire an event
 *
 *
 * @param {Function} synth - the synth function (a function that returns a node graph)
 * @param {AudioNode} destination - if present, all nodes will be connected to
 * this destination
 * @param {Object} options - (Optional) the options may include:
 *
 * - maxVoices: the maximum number of simultaneous voices. No value (by default)
 * means no limit.
 *
 * @return {Player} a player object
 *
 * @example
 * // an instrument with destination
 * var synth = inst((fq) => sine(fq), dest())
 * synth.start('A4')
 * synth.stopAll()
 * @example
 * // only the destination
 * var master = inst(null, conn(mix(0.2), reverb(), dest()))
 * master.start(sine(300))
 * master.start(sine(400))
 * master.stopAll()
 */
export function inst (synth, destination, options) {
  synth = withDest(synth, destination || dest())
  return tracker(synth, options || OPTS)
}

/**
 * tracker: (fn: (object) => Node, options: object) => interface { start: fn, stop: fn }
 * @private
 */
function tracker (synth, opts) {
  var ob = observable({})
  var limit = opts ? opts.maxVoices : 0
  var voices = { limit: limit, all: {}, nextId: 0, current: 0, pool: new Array(limit) }

  function track (node) {
    node.id = voices.nextId++
    voices.all[node.id] = node
    on(node, 'ended', function () {
      delete voices.all[node.id]
      ob.event('voices', Object.keys(voices.all), limit)
    })
    return node
  }

  ob.start = function (value, time, delay, duration) {
    var node = synth(value)
    if (node.start) {
      track(node)
      time = start(node, time, delay, duration).startedAt
      ob.event('start', node.id, time)
      ob.event('voices', Object.keys(voices.all), limit)
    }
    return node
  }
  ob.stop = function (ids, time, delay) {
    var t = 0
    ids = toArr(ids || ids === 0 ? ids : Object.keys(voices.all))
    ids.forEach(function (id) {
      if (voices.all[id]) {
        if (!t) t = when(time, delay, voices.all[id].context)
        voices.all[id].stop(t)
      }
    })
  }
  return ob
}

function start (node, time, delay, duration) {
  if (time && !isA('number', time)) throw Error('Invalid time (maybe forgot connect?): ', time, delay, duration, node)
  time = when(time, delay, context(node.context))
  node.start(time)
  node.startedAt = time
  var d = duration || node.duration
  if (d) node.stop(time + d)
  return node
}

// EVENTS
// ======
// decorate an objet to have `on` and `event` methods
function observable (obj) {
  obj.on = on.bind(null, obj)
  obj.event = event.bind(null, obj)
  return obj
}

// add a listener to a target
function on (target, name, callback) {
  if (!name || name === '*') name = 'event'
  var prev = target['on' + name]
  target['on' + name] = function () {
    if (prev) prev.apply(null, arguments)
    callback.apply(null, arguments)
  }
  return target
}

// fire an event
function event (target, name /*, ...values */) {
  var args = slice.call(arguments, 1)
  if (isA('function', target['on' + name])) target['on' + name].apply(null, args)
  if (isA('function', target.onevent)) target.onevent.apply(null, args)
  return target
}
