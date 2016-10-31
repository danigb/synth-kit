/**
 *
 * @module synth
 */
import { isA, OPTS, assign } from './utils'
import { conn } from './routing'
import { bypass } from './signals'
import { osc } from './oscillators'
import { filter } from './filters'
import { adsr } from './envelopes'

/**
 * A basic subtractive processing unit (one filter, and two envelopes)
 *
 * @param {AudioNode|Number|String} source - The subtractive synth source
 * @param {Object} options - (Optional) the configuration may include:
 *
 * - gain: the gain (defaults to 1)
 * - adsr: the parameters of the gain envelop in the form [attack, decay, sustain, release]
 * - attack, decay, sustain, release: the parameters of the gain envelope. It
 * will override the one provided by adsr parameter if any
 * - filter: an object with the filter properties
 * - filter.type: the filter type ('lowpass' by default)
 * - filter.frequency: the filter frequency (can be follow to use the options.frequency value)
 * - filter.adsr: the filter envelope
 * - filter.attack, filter.decay, filter.sustain, filter.release: the individual
 * filter envelope parameters
 * - filter.octaves: the number of the octaves of the filter envelope (1 by default)
 *
 * @function
 * @example
 * conn(sine(300), subtractive(0.5, { adsr: [0.01, 0.1, 0.8, 1], filter: { type: 'lowpass', frequency: 300 } }))
 * subtractive({ attack: 0.1 })
 */
export var subtractive = withOptions(function (o) {
  var source = isA('function', o.source) ? o.source(o)
    : o.source ? o.source
    : o.frequency ? osc(o.type, o.frequency)
    : bypass()
  var filt = o.filter.frequency ? filter(o.filter) : bypass()
  return conn(source, adsr(o), filt)
}, {
  defaults: {
    frequency: 440,
    type: 'sawtooth',
    adsr: [0.01, 0.1, 0.8, 1],
    filter: {
      type: 'lowpass',
      frequency: null,
      octaves: 2,
      adsr: [0.1, 0.1, 0.5, 1]
    },
    gain: 1
  },
  toOptions: function (source, opts) {
    if (isA('object', source)) return source
    var o = Object.assign({}, opts)
    if (isA('number', source)) o.frequency = source
    else o.source = source
    return o
  },
  prepare: function (o) {
    if (o.filter.frequency === 'follow') o.filter.frequency = o.frequency
    return o
  }
})

/**
 * Decorate a function to receive a options object. This decoration ensures that
 * the function always receive an options object. It also perform some other
 * goodies like convert from note names to frequencies, provide a context
 * option with the AudioContext or wrap notes into { frequency: ... } object.
 *
 * @param {Function} synth - the synth function (a function that returns a
 * graph of audio nodes)
 * @param {Object} config - (Optional) the configuration may include:
 *
 * - defaults: If provided, the defaults object will be merged with the options
 * - toOptions: a function that receives the paramters and returns an object
 * - prepare: a function that can modify the options before call the function
 *
 * @return {Function} a decorated synth function
 * @example
 * var synth = withOptions(function (o) {
 *    return conn(sine(o.frequency),
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
  config = config || OPTS
  return function (options) {
    var toOptions = config.toOptions || freqAndContextToOpts
    if (!isA('object', options)) options = toOptions.apply(null, arguments)
    var opts = assign({}, config.defaults, options)
    if (config.prepare) config.prepare(opts)
    return fn(opts)
  }
}
function freqAndContextToOpts (frequency, context) {
  return { frequency: frequency, context: context }
}

/**
 * Decorate a synth to use a destination. A synth is any function that
 * returns an audio node
 * @param {Function} synth - the audio node builder
 * @param {AudioNode} destination - (Optional) destination (or the default destination)
 * @return {Function} the decorated synth function
 * @example
 * // TODO: write a common example
 * var synth = withDest(sine, dest())
 * synth(300).start()
 * // TODO: make this function public
 * @private
 */
export function withDest (synth, dest) {
  return function (value) {
    var node = synth ? synth(value) : value
    if (dest) node.connect(dest)
    return node
  }
}
