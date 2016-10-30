/**
 * In synth-kit most of the functions accepts an optional AudioContext as
 * last parameter. If no one is provided, synth-kit creates a singleton
 * AudioContext using ['audio-context'](npmjs.com/package/audio-context) module.
 *
 * @module context
 */
import ac from 'audio-context'

// Shim to make connect chainable (soon to be implemented native)
var proto = Object.getPrototypeOf(Object.getPrototypeOf(ac.createGain()))
var _connect = proto.connect
proto.connect = function () {
  _connect.apply(this, arguments)
  return this
}

/**
 * Get the audio context.
 * @param {AudioContext} context - (Optional) if given, it return itself. If
 * nothing passed, it returns the AudioContext singleton instance
 * @return {AudioContext} the audio context
 * @example
 * // normally you won't do this:
 * var gain = context().createGain()
 */
export function context (ctx) {
  return ctx ? ctx.context || ctx : ac
}

/**
 * Get the audio context's destination
 * @param {AudioContext} context - (Optional) an alternate audio context
 * @return {AudioContext} the audio context destination
 * @example
 * connect(sine(300), dest()).start()
 */
export function dest (context) { return (context || ac).destination }

/**
 * Get audio context's current time
 * @param {AudioContext} context - (Optional) an optional audio context
 * @return {Number} the time in seconds relative to the AudioContext creation
 * @example
 * now() // => 3.3213
 */
export function now (context) { return (context || ac).currentTime }

/**
 * Get a valid time
 * @param {Float} time - the time (equal or greater than now(), otherwise, ignored)
 * @param {Float} delay - the delay
 * @param {AudioContext} context - (Optional) an optional audio context
 * @example
 * now() // => 0.7
 * time(0.2) // => 0.7
 * time(1) // => 1
 * time(0.2, 1) // => 1.7 (time is ignored because is < than now())
 */
export function when (time, delay, ctx) {
  return Math.max(now(ctx), time || 0) + (delay || 0)
}

/**
 * Get time after n seconds (from now)
 * @function
 * @param {Float} delay - the delay
 * @param {AudioContext} context - (Optional) an optional audio context
 * @return {Float} time in seconds
 * @example
 * now() // => 0.785
 * after(1) // => 1.785
 */
export var after = when.bind(0)

/**
 * Get audio context sampling rate
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the context's sampling rate
 * @example
 * samplingRate() // => 44100
 */
export function samplingRate (ctx) { return context(ctx).sampleRate }

/**
 * Convert from seconds to samples (using AudioContext sampling rate)
 * @param {Float} seconds - the number of seconds
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the number of samples
 * @example
 * white(seconds(1.2)) // => generate 1.2 seconds of white noise
 */
export function timeToSamples (secs, context) { return secs * samplingRate(context) }
