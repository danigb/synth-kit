var isArray = Array.isArray

var Generators = {
  silence: function () { return 0 },
  pulse: function () { return 1 },
  white: function () { return Math.random() * 2 - 1 }
}

// BUFFERS
// =======
// Logarithmic decay impulse buffer: http://stackoverflow.com/questions/22525934/connecting-convolvernode-to-an-oscillatornode-with-the-web-audio-the-simple-wa
// Reverb gen: https://github.com/adelespinasse/reverbGen/blob/master/reverbgen.js
/**
 * Create a buffer from a generator. The generator can be one of 'silence',
 * 'pulse', 'white' or a custom function.
 */
export function Buffer (props) {
  return function (ac) {
    var data, gen, n, decay
    var reverse = props.reverse === true
    var numOfChannels = props.numOfChannels || 1
    var rate = props.sampleRate || ac.sampleRate
    var samples = props.length || (props.duration || 1) * rate
    var attackSamples = Math.round((props.attack || 0) * rate)
    var decaySamples = Math.round((props.decay || 0) * rate)
    // 60dB is a factor of 1 million in power, or 1000 in amplitude.
    var decayBase = Math.pow(1 / 1000, 1 / decaySamples)
    console.log('decay', decayBase, decaySamples)
    var buffer = ac.createBuffer(numOfChannels, samples, rate)
    for (var c = 0; c < numOfChannels; c++) {
      data = buffer.getChannelData(0)
      gen = getGenerator(props.generator, c)
      for (var i = 0; i < samples; i++) {
        n = reverse ? samples - i : i
        decay = decayBase ? Math.pow(decayBase, i) : 1
        data[i] = gen(n, data[i - 1]) * decay
        if (i < attackSamples) data[i] *= (i / attackSamples)
      }
    }
    console.log('buffer', props.generator)
    return buffer
  }
}
var seconds = { type: 'number', units: 'seconds' }
Buffer.propsType = {
  attack: seconds,
  decay: seconds,
  reverse: { type: 'boolean' },
  sampleRate: { type: 'number' },
  length: { type: 'number', units: 'samples' },
  duration: seconds,
  numOfChannels: { type: 'number' },
  generator: { type: ['enum', 'function'], values: Object.keys(Generators) }
}
Buffer.defaultProps = {
  numOfChannels: 1,
  duration: 1,
  reverse: false,
  attack: 0,
  decay: 0
}

function getGenerator (gen, channel) {
  return isArray(gen) ? (gen[channel] || Generators.silence)
  : Generators[gen] || gen || Generators.silence
}
