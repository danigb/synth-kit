import { ac, isFn, isNum, lifecycle, plug, samplingRate } from './utils'

/**
 * Create a buffer source (sample player)
 */
export function sample (buffer, loop, detune, context) {
  var src = (context || ac).createBufferSource()
  src.buffer = isFn(buffer) ? buffer() : buffer
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
export function buffer (generators, samples, reverse, context) {
  return function () {
    var data, generator, numOfChannels, n, ch, i

    if (!Array.isArray(generators)) generators = [ generators ]
    samples = samples || 0
    reverse = reverse === true
    numOfChannels = generators.length
    if (!context) context = ac

    var buffer = context.createBuffer(numOfChannels, samples, samplingRate(context))
    for (ch = 0; ch < numOfChannels; ch++) {
      data = buffer.getChannelData(0)
      generator = generators[ch]
      for (i = 0; i < samples; i++) {
        n = reverse ? samples - i : i
        data[i] = generator(n, data[i - 1], samples)
      }
    }
    return buffer
  }
}

/**
 * Generate white noise
 */
export function white (samples, loop, context) {
  if (!isNum(samples)) samples = samplingRate(context)
  loop = loop !== false
  return sample(buffer(noiseGen, samples, false, context), loop, 0, context)
}
function noiseGen () { return Math.random() * 2 - 1 }
