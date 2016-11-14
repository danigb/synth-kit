/**
 * This module provides some typical syntetizers components, like vca, vcf
 * and some syntetizers
 * @example
 * // a dual osc synth sound
 * synth(
 *  frequency: 440,
 *  oscillators: { ratios: [1, 5/7, 9/8], types: 'saw' },
 *  attack: 0.1, release: 0.1,
 *  filter: { frequency: 'follow' }
  ).connect(dest()).start()
 * @module synths
 */
import { isA, OPTS, assign, toArr } from './utils'
import { dBToGain } from './units'
import { conn, add } from './routing'
import { gain, mult, signal } from './signals'
import { osc } from './oscillators'
import { filter } from './filters'
import { adsr } from './envelopes'

/**
 * Decorate a function to have default configuration
 */
export function withDefaults (synth, defaults) {
  return function (options) {
    return synth(assign({}, defaults, options))
  }
}

/**
 * Create a VCA: an amplifier controlled by an ADSR envelope
 * @function
 * @param {Object} options - may include:
 * @return {AudioNode} a GainNode
 *
 * - db: the gain in decibels
 * - gain: the gain (will override dB param)
 * - attack, decay, sustain, release: the ADSR envelope parameters
 * - context: the audio context
 */
export const vca = withDefaults(function (opts) {
  if (!isA('number', opts.gain)) opts.gain = dBToGain(opts.dB) || 1
  return conn(gain(opts), adsr(opts))
}, {
  dB: 0, // in dB
  attack: 0.01, // attack time in seconds
  decay: 0.1, // decay time in seconds
  sustain: 0,
  release: 0.1
})

/**
 * Create a VCF: a filter controlled by an ADSR envelope
 * @function
 * @param {Object} config - may include:
 * @return {AudioNode} the BiquadFilterNode
 *
 * - type: filter type
 * - frequency: filter frequency (can be a signal)
 * - octaves: amplitude of the modulation in octaves (defaults to 2)
 * - attack, decay, sustain, release: the adsr parameters
 * - context: the audio context

 * @example
 * conn(square({ frequency: 800 }), vcf({ frequency: 400, attack: 0.1 }))
 */
export const vcf = withDefaults(function (opts) {
  var mod = conn(signal(mult(opts.octaves, opts.frequency)), adsr(opts))
  return filter(opts.type, add(signal(opts.frequency), mod), opts)
}, {
  type: 'lowpass',
  frequency: 22000,
  octaves: 2,
  attack: 0.01,
  decay: 0.1,
  sustain: 0,
  release: 0.1
})

/**
 * A subtractive synthetizer (oscillator bank -> VCF -> VCA)
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
 * // a 300Hz sawtooth with adsr and lowass filter at 600
 * subtractive({ frequency: 300, type: 'sawtooth', adsr: [0.01, 0.1, 0.8, 1], filter: { type: 'lowpass', frequency: 600 } })
 * // a custom source node
 * substractive({ source: add(white(), square(500)), attack: 0.1, duration: 1 })
 * // connected in a chain
 * connect(sample('snare.wav', subtractive({ attack: 0.1 }))
 */
export function subtractive (opts) {
  opts = opts || OPTS
  return conn(bank(opts), vcf(opts.filter), vca(opts))
}

/**
 * Create a bank of oscillators.
 *
 * @param {Array<Float>} frequencies - an array with the frequencies
 * @param {Object} options - (Optional) options can include:
 *
 * - frequencies: an array with the frequencies of the oscillators (will
 * override ratios)
 * - ratios: an array of relative freqnecies of the oscillators (in combination
 * iwth frequency paramter)
 * - frequency: the base frequency of the oscillators (only used if frequencies)
 * - types: a value or an array of oscillator types. If the array is shorter
 * than the frequencies array, it's assumed to be circular.
 * - gains: a value or an array of gain values. If the array is shorter
 * than the frequencies array, it's assumed to be circular.
 * - compensate: if true, the gain of the bank will be reduced by the number
 * of oscillators (true by default)
 *
 * @return {AudioNode}
 *
 * @example
 * // create three sines with unrelated frequencies:
 * bank({ frequencies: [1345.387, 435.392, 899.432] })
 * // create three sawtooth with relative frequencies:
 * bank({ frequency: 440, ratios: [1, 2, 2.4] , types: 'sawtooth' })
 * // create two squares of 400 and 800 and two sawtooths of 600 and 1200
 * // (the types are cyclic)
 * bank({ frequencies: [400, 600, 800, 1200], types: ['square', 'sawtooth'] })
 * // specify gains
 * bank({ frequencies: [440, 660], gains: [0.6, 0.2] })
 */
export function bank (opts) {
  opts = opts || OPTS
  var base = opts.ratios ? opts.frequency || 440 : 1
  var freqs = toArr(opts.frequencies || opts.ratios || 440)
  var gains = toArr(opts.gains || 1)
  var types = toArr(opts.types || 'sine')
  var N = opts.compensate === false ? 1 : freqs.length

  var tl = types.length
  var gl = gains.length
  return conn(add(freqs.map(function (freq, i) {
    var src = osc(types[i % tl], base * freq)
    var g = gains[i % gl]
    return g === 1 ? src : conn(src, gain(g))
  })), gain(1 / N))
}

/**
 * Decorate a synth to use a destination. A synth is any function that
 * returns an audio node
 * @param {Function} synth - the audio node builder
 * @param {AudioNode} destination - (Optional) destination (or the default destination)
 * @return {Function} the decorated synth function
 * @example
 * // TODO: write a more realistic example
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
