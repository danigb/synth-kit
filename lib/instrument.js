/** @module instrument */
import { context, when, dest } from './context'
import { isA } from './units'
var slice = Array.prototype.slice

/**
 * Decorate a function to receive a options object. This decoration ensures that
 * the function always receive an options object. It also perform some other
 * goodies like convert from note names to frequencies, provide a context
 * option with the AudioContext or wrap notes into { frequency: ... } object.
 *
 * The possible values of the config object are:
 *
 * - defaults: If provided, the defaults object will be merged with the options
 * - toOptions: a function that is called if the given parameter is not an
 * options configuration. If not provided, by default it will put the parameter
 * as the frequency of the options (see example)
 *
 * @param {Function} synth - the synth function (a function that returns a
 * graph of audio nodes)
 * @param {Object} config - the configuration
 * @return {Function} a decorated synth function
 * @example
 * var synth = withOptions(function (o) {
 *    return connect(sine(o.frequency),
 *      filter(o.filter.type, o.filter.frequency || o.frequency))
 * }, {
 *  defaults: { frequency: 440, filter: { type: 'lowpass' } }
 * })
 * // It will convert note names into frequencies automatically
 * synth({ frequency: 'A4' })
 * // By default will convert note names to { frequency: <freq of note> }
 * synth('A4') // equivalent to: synth({ frequency: 440 })
 */
export function withOptions (fn, config) {
  config = config || {}
  config.toOptions = config.toOptions || freqAndContextToOpts
  return function (options) {
    if (!isA('object', options)) options = config.toOptions.apply(null, arguments)
    return fn(Object.assign({}, config.defaults, options))
  }
}
function freqAndContextToOpts (frequency, context) {
  return { frequency: frequency, context: context }
}

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
 * - `on(event, callback)`: add an event callback
 * - `trigger(event, ...values)`: make the player trigger an event
 *
 *
 * @param {Function} synth - the synth function (a function that returns a node graph)
 * @param {AudioNode} destination - if present, all nodes will be connected to
 * this destination
 * @param {Integer} maxVoices - (Optional) the maximum number of simultaneous
 * voices (0 means no limit, defaults to 0)
 * @return {Player} a player object
 *
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
    var node = isA('function', synth) ? synth(value) : value
    if (destination) node.connect(destination)

    trackNode(voices, node)
    time = when(time, delay, context(destination))
    node.start(time)
    if (duration) node.stop(time + duration)
    return node
  }
  i.track = trackNode.bind(null, voices)
  i.stop = function () { return stopAll(voices) }
  i.inst = function (synth, maxVoices) { return inst(synth, destination, maxVoices) }
  i.on = on.bind(null, i)
  i.trigger = trigger.bind(null, i)
  return i
}

// init a voices data object
function initVoices (limit) {
  limit = limit || 0
  return { limit: limit, all: {}, nextId: 0, current: 0, pool: new Array(limit) }
}

// add a given node to the voices data object
function trackNode (voices, node) {
  node.id = voices.nextId++
  voices.all[node.id] = node
  on(node, 'ready', function (_, name) {
    console.log('Instrument ready:', name)
  })
  return node
}

// stop all voices from the voices data object
function stopAll (voices) {
  Object.keys(voices.all).forEach(function (id) {
    voices.all[id].stop()
  })
}

// add a listener to a target
function on (target, event, callback) {
  if (!event || event === '*') event = 'event'
  var prev = target['on' + event]
  target['on' + event] = function () {
    if (prev) prev.apply(null, arguments)
    callback.apply(null, arguments)
  }
}

// trigger an event
function trigger (target, event /*, ...values */) {
  if (!isA('function', target['on' + event])) return
  var args = slice.call(arguments, 2)
  target['on' + event].apply(null, args)
  if (isA('function', target.onevent)) target.onevent.apply(null, args)
}
