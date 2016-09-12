
var Curves = {
  none: function (i) { return i },
  // https://github.com/Tonejs/Tone.js/blob/master/Tone/source/PulseOscillator.js#L70
  square: function (n) { return n < 0 ? -1 : 1 },
  // https://github.com/nick-thompson/neuro/blob/master/lib/effects/WaveShaper.js
  // http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-1/
  'clip-hard': function (x) { return 0.5 * (Math.abs(x + 0.63) - Math.abs(x - 0.63)) },
  'clip-soft': function (x) { return Math.tanh(x) },
  'clip-cubic': function (x) { return x - Math.pow(x, 3) / 4 },

  'audio-to-gain': function (i) { return (i + 1) / 2 },

  // http://stackoverflow.com/questions/16871576/web-audio-filter-node-popping/16887640#16887640
  'rectifier': function (i, _, len) {
    len = len / 2
    return i < len ? 0 : (i / len) - 1
  }
}

/**
* Create a wave shaper curve. If a name is given, the curve is cached
*/
export function WaveShaperCurve (props) {
  return function () {
    var length = props.length || 1024
    var generator = Curves[props.generator] || props.generator || Curves.none
    console.log('shape', props.generator, generator, length)
    var curve = new Float32Array(length)
    var normalized
    for (var i = 0; i < length; i++) {
      normalized = (i / (length - 1)) * 2 - 1
      curve[i] = generator(normalized, i)
    }
    return curve
  }
}
WaveShaperCurve.propTypes = {
  length: { type: 'number' },
  generator: { type: ['enum', 'function'], values: Object.keys(Curves) }
}
WaveShaperCurve.defaultProps = {
  length: 1024, generator: 'none'
}

// arbitrary constant for overdrive
var K = 2
function overdrive (x) { return (1 + K) * x / (1 + K * Math.abs(x)) }
