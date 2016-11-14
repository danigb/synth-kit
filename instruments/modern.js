import { OPTS, isA } from './utils'
import { withDefaults } from './synth'
import { samplingRate } from './context'
import { osc } from './oscillators'
import { constant, signal, gain } from './signals'
import { conn, add } from './routing'
import { filter, lowpass, hipass } from './filters'
import { adsr } from './envelops'

// A modern syntetizer

var OSC_TYPES = ['sine', 'triangle', 'sawtooth', 'square']

export const synth = function (opts) {
  return conn(
    oscillators(opts.oscillators),
    vcf(opts.filter), vca(opts.vca))
}

/**
 * Create a signal buy playin several oscillators at the same time
 * @param {Object} options - (Optional) with the following defaults:
 *
 * @example
 * oscillators({
 *   frequency: 440,
 *   oscillators: {
 *     sine: { gain 0.5, octave: 0 },
 *     sawtooth: { gain: 0.2, octave: -1, detine: 3 }
 *  }
 * })
 */
export const oscillators = withDefaults(function (opts) {
  var oscs = OSC_TYPES.map(function (name) {
    var opt = opts.oscillators['name']
    return conn(osc(name, opts.frequency, opt), gain(opt.gain))
  })
  return conn(add(oscs), tone(opts.oscillators.tone))
}, {
  frequency: 440,
  sine: { gain: 0, octave: 0 },
  triangle: { gain: 0, octave: 0 },
  sawtooth: { gain: 0, octave: 0 },
  square: { gain: 0, octave: 0 },
  tone: 0
})

/**
 * Create a tone node.
 * @param {Number} value - tone value (from -1 to 1)
 * @param {Object} options - (Optional)
 * @return {AudioNode} the tone
 * @example
 * conn(sine(300), tone(-0.5))
 * @example
 * tone({ value: -0.5, context: <AudioContext> })
 */
export function tone (value, opts) {
  if (arguments.length === 1 && isA('object', value)) return tone(value.value, value)
  opts = opts || OPTS
  var nyquist = samplingRate(opts.context) / 2

  var src = conn(signal(nyquist, opts), gain(value, opts))
  var tone = add(
    lowpass(add(src, constant(nyquist))),
    hipass(add(src, constant(-nyquist)))
  )
  tone.value = signal.signal
  return tone
}
