import ac from 'audio-context'

// Shim to make connect chainable (soon to be implemented native)
var proto = Object.getPrototypeOf(Object.getPrototypeOf(ac.createGain()))
var _connect = proto.connect
proto.connect = function () {
  _connect.apply(this, arguments)
  return this
}

/**
 * Get the audio context
 */
export function context (ctx) { return ctx || ac }

/**
 * Get the audio context of an audio node
 */
export function contextOf (node) { return node ? context(node.context) : ac }

/**
 * Get the audio context's destination
 */
export function dest (context) { return (context || ac).destination }

/**
 * Get audio context's current time
 */
export function now (context) { return (context || ac).currentTime }

/**
 * Get a valid time
 * @param {Float} time - the time (equal or greater than now(), otherwise, ignored)
 * @param {Float} delay - the delay
 * @param {AudioContext} context - (Optional) the audio context
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
 * @param {AudioContext} context - (Optional) the audio context
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
export function samplingRate (context) { return (context || ac).sampleRate }

/**
 * Convert from seconds to samples (using AudioContext sampling rate)
 * @param {Float} seconds - the number of seconds
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the number of samples
 * @example
 * white(seconds(1.2)) // => generate 1.2 seconds of white noise
 */
export function seconds (secs, context) { return secs * samplingRate(context) }
