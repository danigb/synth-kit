/**
 * In synth-kit buffers can be generated (with the `gen` function) or
 * retrieved from an audio file (with the `sample`) function
 *
 * @module buffers
 */
import { isA, OPTS } from './utils'
import { context, samplingRate } from './context'
import { lifecycle, plug } from './routing'
import { load } from './load'

/**
 * Create a buffer source (a BufferSourceNode)
 * @param {Buffer|Function} buffer - the buffer (or a function that returns a buffer)
 * @param {Object} options - (Optional) options can include:
 *
 * - loop: set to true to loop the buffer
 * - detune: the detune amount (can be a number or a signal)
 * - context: the audio context to use
 *
 * @return {AudioNode} a BufferSourceNode
 * @example
 * source(sample('snare.wav')).start()
 * source(sample('amen-break.mp3'), { loop: true })
 */
export function source (buffer, o) {
  o = o || OPTS
  var src = context(o.context).createBufferSource()
  src.buffer = isA('function', buffer) ? buffer() : buffer
  if (!src.buffer) console.warn('Buffer not ready.')
  if (o.loop) src.loop = true
  return lifecycle(src, [
    plug('detune', o.detune, src)
  ])
}

/**
 * Fetch a remote audio sample. You get a function that returns an AudioBuffer
 * when loaded or null otherwise. Or you can chain like a promise.
 *
 * @param {String} url - the url of the file
 * @param {Object} options - (Optional) options can include:
 *
 * - context: the audio context to use
 *
 * @return {Function} a function the returns the buffer
 *
 * @example
 * source(sample('server.com/audio-file.mp3')).start()
 * @example
 * // use the Promise like interface
 * sample('audio-file.mp3').then(function (buffer) {
 *     source(buffer).start()
 * })
 */
export function sample (url, opts) {
  var bf = null
  function buffer () { return bf }
  var promise = load(url, opts).then(function (buffer) {
    buffer.url = url
    bf = buffer
    return bf
  })
  buffer.then = promise.then.bind(promise)
  return buffer
}

/**
 * Generate a BufferNode. It returns a no-parameter function that
 * returns a buffer. This way, it's easy to memoize (cache) buffers.
 *
 * @param {Function|Array<Function>} generators - a generator or a list of
 * generators (to create a buffer with multiple channels)
 * @param {Integer} samples - the length in samples
 * @param {Object} options - (Optional) options can include:
 *
 * - reverse: set to true to reverse the generated buffer
 * - context: the audio context to use
 *
 * @return {Function} a function with no parameters that returns the desired buffer
 */
export function gen (generators, samples, o) {
  samples = samples || 2
  o = o || OPTS
  return function () {
    if (!Array.isArray(generators)) generators = [ generators ]
    var reverse = o.reverse
    var numOfChannels = generators.length
    var ctx = context(o.context)

    var buffer = ctx.createBuffer(numOfChannels, samples, samplingRate(ctx))
    for (var ch = 0; ch < numOfChannels; ch++) {
      generateData(generators[ch], buffer.getChannelData(ch), samples, reverse)
    }
    return buffer
  }
}

function generateData (generator, data, samples, reverse) {
  for (var i = 0; i < samples; i++) {
    data[i] = generator(reverse ? samples - i : i)
  }
}

/**
 * White noise source node.
 * @param {Integer} length - lenth in samples
 * @param {Object} options - (Optional) the same options that `source` function
 * @return {AudioNode} the white noise audio node generator
 * @see source
 * @example
 * conn(white(seconds(1)), perc(), dest()).start()
 */
export function white (samples, options) {
  if (!isA('number', samples)) samples = samplingRate(options)
  return source(gen(white.generator, samples, options), options)
}
white.generator = function () { return Math.random() * 2 - 1 }
