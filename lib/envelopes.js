/**
 *
 * @module envelopes
 */
import { when } from './context'
import { gain, scale } from './signals'
import { isA, OPTS } from './utils'
function eachStage (stages, fn) { stages.forEach(function (s) { fn.apply(null, s) }) }

/**
 * Create an attack-decay envelope with fixed duration. It's composed by a
 * linear attack ramp and an exponential decay. This envelope doesn't
 * have release, so it stops after the duration (attack + decay).
 *
 * @param {Number} attack - (Optional) the attack time, defaults to 0.01
 * @param {Number} decay - (Optional) the decay time, defaults to 0.2
 * @param {Object} options - (Optional) an options with a context
 * @return {AudioNode} the signal envelope
 * @example
 * conn(sine(1000), perc(0.01, 0.5))
 * conn(sine(1000), perc(null, 1)) // default attack
 * conn(sine(1000), perc()) // default values
 */
export function perc (attack, decay, opts) {
  if (isA('object', attack)) return perc(attack.attack, attack.decay, attack)
  var a = [ [0, 0, 'set'], [attack || 0.01, 1, 'lin'], [decay || 0.2, 0, 'exp'] ]
  return envelope(a, null, opts)
}

var ADSR = [0.01, 0.1, 0.8, 0.3]
/**
 * Create an adsr envelope
 * @params {Object} options - (Optional) the options may include:
 *
 * - adsr: an array with the form [attack, decay, sustain, release]
 * - attack: the attack time (will override the a in the adsr param)
 * - decay: the decay time (will override the d in adsr param)
 * - sustain: the sustain gain value (will override the s in the adsr param)
 * - release: the release time (will override the r in the adsr param)
 */
export function adsr (o) {
  o = o || OPTS
  var adsr = o.adsr || ADSR
  if (!isA('number', o.attack)) o.attack = adsr[0]
  if (!isA('number', o.decay)) o.decay = adsr[1]
  if (!isA('number', o.sustain)) o.sustain = adsr[2]
  if (!isA('number', o.release)) o.release = adsr[3]
  var a = [ [0, 0, 'set'], [o.attack, 1, 'lin'], [o.decay, o.sustain, 'exp'] ]
  var r = [ [0, o.sustain, 'set'], [o.release, 0, 'exp'] ]
  return envelope(a, r, o)
}

/**
 * A frequency envelope. Basically the setup to provide an adsr over a
 * number of octaves.
 * @param {Number} frequency - the initial frequency
 * @param {Number} octaves - (Optional) the number of octaves of the envelope (1 by default)
 * @param {Object} options - the same options as an ADSR envelope
 * @see adsr
 * @example
 * conn(saw(1200), lowpass(freqEnv(440, 2, { release: 1 })))
 */
export function freqEnv (freq, octs, a, d, s, r, ac) {
  return scale(freq, freq * Math.pow(2, octs), adsr(a, d, s, 0, r, ac))
}

/**
 * Create a gain envelope
 * @param {Array<Stage>} attStages - the attack part of the envelope
 * @param {Array<Stage>} relStages - the release part of the envelope
 * @private
 */
export function envelope (attEnvelope, relEnvelope, opts) {
  var g = gain(0, opts)
  g.start = apply(g.gain, attEnvelope)
  if (!relEnvelope) {
    g.duration = duration(attEnvelope)
    g.stop = function () {}
  } else {
    g.stop = apply(g.gain, relEnvelope)
    g.release = duration(relEnvelope)
  }
  return g
}

/**
 * Apply a contour to a parameter
 * @param {AudioParam} param - the parameter to apply the contour to
 * @param {Array<Stage>} contour - a list of countour stages, each of which
 * is composed of [time, value, type].
 * @example
 * apply(filter.frequency, [ [0, 440, 'set'], [5, 880, 'lin'] ])
 * @private
 */
function apply (param, contour) {
  return function (t) {
    t = when(t, 0, param.context)
    eachStage(contour, function (time, value, type) {
      t += time
      if (type === 'set') param.setValueAtTime(value, t)
      else if (type === 'lin') param.linearRampToValueAtTime(value, t)
      else if (type === 'exp') param.exponentialRampToValueAtTime(value !== 0 ? value : 0.00001, t)
      else console.warn('Invalid stage type', time, value, type)
    })
  }
}

/**
 * Calculate the duration of a contour
 * @private
 */
function duration (contour) {
  return contour.reduce(function (dur, stage) {
    return dur + stage[0]
  }, 0)
}
