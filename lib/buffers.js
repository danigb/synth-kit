import { context, samplingRate } from './context'
import { isFn, isNum, lifecycle, plug } from './utils'
import { load } from './load'

/**
 * Get a remote audio sample. You get a function that returns an AudioBuffer
 * when loaded or null otherwise. Or you can chain like a promise.
 *
 * @param {String} url - the url of the file
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Function} a function the returns the buffer
 * @example
 * source(sample('server.com/audio-file.mp3')).start()
 * @example
 * // use the Promise like interface
 * sample('audio-file.mp3').then(function (buffer) {
 *     source(buffer).start()
 * })
 */
export function sample (url, ac) {
  var bf = null
  function buffer () { return bf }
  var promise = load(url, ac).then(function (result) { bf = result })
  buffer.then = promise.then.bind(promise)
  return buffer
}

/**
 * Create a buffer source node.
 * @param {Buffer|Function} buffer - the buffer (or a function that returns a buffer)
 * @param {Boolean} loop - (Optional) loop the buffer or not (defaults to false)
 * @param {Integer|Node} detune - (Optional) the detune value or modulator
 * @param {AudioContext} context - (Optional) the audio context
 * @return {AudioNode} BufferSourceNode
 */
export function source (buffer, loop, detune, ac) {
  var src = context(ac).createBufferSource()
  src.buffer = isFn(buffer) ? buffer() : buffer
  if (!src.buffer) console.warn('Buffer not ready.')
  src.loop = loop
  return lifecycle(src, [
    plug('detune', detune, src)
  ])
}

/**
 * Generate a BufferNode. It returns a no-parameter function that
 * returns a buffer. This way, it's easy to memoize (cache) buffers.
 *
 * @param {Function|Array<Function>} generators - a generator or a list of
 * generators (to create a buffer with multiple channels)
 * @param {Integer} samples - the length in samples
 * @param {Boolean} reverse - (Optional) true if you want the buffer reversed
 * @return {Function} a function with no parameters that returns the desired buffer
 */
export function generate (generators, samples, reverse, ac) {
  return function () {
    if (!Array.isArray(generators)) generators = [ generators ]
    samples = samples || 0
    reverse = reverse === true
    var numOfChannels = generators.length

    var buffer = context(ac).createBuffer(numOfChannels, samples, samplingRate(ac))
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
 * @param {Boolean} loop - (Optional) infinite duration
 * @param {AudioContext} context - (Optional) audio context
 * @return {AudioNode} the white noise audio node generator
 * @example
 * connect(white(seconds(1)), perc(), dest()).start()
 */
export function white (samples, loop, ac) {
  if (!isNum(samples)) samples = samplingRate(ac)
  loop = loop !== false
  return source(generate(whiteGen, samples, false, ac), loop, 0, ac)
}
function whiteGen () { return Math.random() * 2 - 1 }
