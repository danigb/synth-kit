(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.SynthKit = factory());
}(this, (function () { 'use strict';

var slice = Array.prototype.slice

// UTILITY
function bpmToHz (bpm) { return bpm / 60 }

// ROUTING
// =======
function Connect (/* nodes */) {
  return ['Connect', { type: 'serial', nodes: slice.call(arguments) }]
}
function Add (/* nodes */) {
  return ['Connect', { type: 'parallel', nodes: slice.call(arguments) }]
}
function Destination () {
  return ['Destination', {}]
}

// VOLUME
// ======
function Gain (gain) {
  return ['Gain', { gain: gain }]
}
function Bypass () {
  return ['Gain', { gain: 1 }]
}

// OSCILLATORS
// ===========
function Osc (type, freq, detune) {
  return ['Oscillator', { type: type, frequency: freq, detune: detune }]
}
function Sine (freq, detune) { return Osc('sine', freq, detune) }
function Saw (freq, detune) { return Osc('sawtooth', freq, detune) }
function Square (freq, detune) { return Osc('square', freq, detune) }
function Triangle (freq, detune) { return Osc('triangle', freq, detune) }

// https://github.com/cwilso/oscilloscope/blob/master/js/audio.js
function PulseWave (freq, duty) {
  return Connect(
    Add(Saw(freq), Signal(duty)), Shape('square')
  )
}

// FILTERS
// =======
function Filter (type, freq, Q) {
  return ['BiquadFilter', { type: type, frequency: freq, Q: Q }]
}
function Lowpass (freq, Q) { return Filter('lowpass', freq, Q) }
function Hipass (freq, Q) { return Filter('hipass', freq, Q) }
function Bandpass (freq, Q) { return Filter('bandpass', freq, Q) }

// BUFFERS
// =======
function Buffer (duration, generator, length) {
  return ['Buffer', { duration: duration, length: length, generator: generator }]
}
function Source (buffer, detune, loop) {
  return ['BufferSource', { buffer: buffer, detune: detune, loop: loop }]
}
function White (duration, length) {
  return Source(Buffer(duration, 'white', length))
}

// ENVELOPES
// =========
function Envelope (attack, release) {
  return ['Envelope', { attack: attack, release: release }]
}

function Perc (attack, decay, max, min) {
  return Envelope([
    'set', min || 0, 0,
    'lin', max || 1, attack || 0.001,
    'exp', min || 0, decay || 0.1
  ])
}

function AD (attack, decay, hold, max, min) {
  return Envelope([
    'set', min || 0, 0,
    'lin', max || 1, attack || 0.001,
    'set', max || 1, hold || 0,
    'lin', min || 0, decay || 0.1
  ])
}
function ADSR (attack, decay, sustain, release, hold, max, min) {
  return Envelope([
    'set', min || 0, 0,
    'lin', max || 1, attack || 0.001,
    'lin', sustain || 0.8, decay || 0.1,
    'set', sustain || 0.8, hold || 0
  ], release ? ['lin', min || 0, release] : null)
}

// WAVE SHAPERS
function WaveShaper (curve, oversample) {
  return ['WaveShaper', { curve: curve }]// , oversample: 'none' }]
}
function WaveShaperCurve (type, length) {
  return ['WaveShaperCurve', { generator: type, length: length || 1024 }]
}
function Shape (type, length) {
  return WaveShaper(WaveShaperCurve(type, length))
}

/**
 * Convert an audio signal [-1, 1] to a gain signal [0, 1]
 */
function toGain (Signal) {
  return Connect(Signal, Shape('audio-to-gain'))
}

// EFFECTS
function Mix (amount, Effect, compensate) {
  var gain = compensate ? 1 - amount : 1
  return Add(Gain(gain), Connect(Effect, Gain(amount)))
}
function DelaySignal (delayTime, maxDelay) {
  return ['Delay', { delayTime: delayTime, maxDelay: maxDelay || 2 * delayTime }]
}
function ReverbIR (duration, decay, attack, reverse) {
  return ['Buffer', {
    numOfChannels: 2, generator: 'white', duration: duration,
    decay: decay || (duration / 1.2), attack: attack || 0, reverse: reverse
  }]
}
function Convolver (buffer, normalize) {
  return ['Convolver', { buffer: buffer, normalize: normalize }]
}
function Reverb (amount, duration, decay, reverse) {
  var key = 'RevIR' + duration + '|' + decay + (reverse ? 'r' : '')
  var IR = Memo(key, ReverbIR(duration, decay, 0.1, reverse))
  return Mix(amount, Convolver(IR))
}

// UTILITY
// =======
function Pulse () {
  return Source(Memo('pulse', Buffer(0, 'pulse', 2)), 0, true)
}

/**
 * Create a source that generates a signal.
 */
function Signal (value) {
  return Connect(Pulse(), Gain(value))
}

/**
 * Inverse the signal
 */
function Inverse () {
  return Gain(-1)
}

function Memo (id, node) {
  return ['Memoize', { id: id, node: node }]
}

/**
 * Modulate a value with an envelope, an oscillator or another source.
 * @param {Integer} value - the value to modulate
 * @param {Integer} amount - the ammount of modulation (1 means same as value)
 * @param {Synth} source - the source modulator
 * @example
 * Mod(400, 0.5, sine(10)) // => a sine that oscillates between 200 and 600 at 10Hz
 * Mod(400, 0.5, ADSR()) // => An ADSR with peak at 600 and low at 400 (instead of 0 and 1)
 */
function Mod (value, amount, Source) {
  return Add(
    Signal(value),
    Connect(Pulse(), Source, Gain(value * amount))
  )
}


var Kit = Object.freeze({
  bpmToHz: bpmToHz,
  Connect: Connect,
  Add: Add,
  Destination: Destination,
  Gain: Gain,
  Bypass: Bypass,
  Osc: Osc,
  Sine: Sine,
  Saw: Saw,
  Square: Square,
  Triangle: Triangle,
  PulseWave: PulseWave,
  Filter: Filter,
  Lowpass: Lowpass,
  Hipass: Hipass,
  Bandpass: Bandpass,
  Buffer: Buffer,
  Source: Source,
  White: White,
  Envelope: Envelope,
  Perc: Perc,
  AD: AD,
  ADSR: ADSR,
  WaveShaper: WaveShaper,
  WaveShaperCurve: WaveShaperCurve,
  Shape: Shape,
  toGain: toGain,
  Mix: Mix,
  DelaySignal: DelaySignal,
  ReverbIR: ReverbIR,
  Convolver: Convolver,
  Reverb: Reverb,
  Pulse: Pulse,
  Signal: Signal,
  Inverse: Inverse,
  Memo: Memo,
  Mod: Mod
});

function isFn$1 (x) { return typeof x === 'function' }

var Types = {
  gain: { type: 'number', units: 'gain' },
  oscType: { type: 'enum', values: ['sine', 'sawtooth', 'square', 'triangle'] },
  frequency: { type: 'number', units: 'hz' },
  detune: { type: 'number', units: 'cents' },
  filterType: { type: 'enum' },
  Q: { type: 'number' },
  buffer: { type: 'buffer' },
  curve: { type: 'function' },
  oversample: { type: 'enum', values: ['none', '2x', '4x'] },
  delay: { type: 'number', units: 'seconds' }
}

// MEMOIZE
// =======

function Memoize (props) {
  if (!props.id) throw Error('Memoize must include an id')
  return function (ac) {
    var id = props.id
    if (!ac[id]) {
      ac[id] = props.node ? props.node(ac) : null
    }
    return ac[id]
  }
}

function Destination$1 (props) {
  return function (ac) { return ac.destination }
}

// BASIC NODES
// ===========
var Gain$1 = NodeBuilder('Gain', { gain: Types.gain }, { gain: 1 })

var Oscillator = NodeBuilder('Oscillator',
  { type: Types.oscType, frequency: Types.frequency, detune: Types.detune },
  { type: 'sine', frequency: 440, detune: 0 })

var BiquadFilter = NodeBuilder('BiquadFilter',
  { type: Types.filterType, frequency: Types.frequency, Q: Types.Q },
  { type: 'lowpass', frequency: 5000, Q: 1 })

var BufferSource = NodeBuilder('BufferSource',
 { buffer: Types.buffer, loop: Types.loop, detune: Types.detune },
 { buffer: null, loop: false, detune: 0 })

function Convolver$1 (props) {
  return Node('Convolver', props)
}
Convolver$1.propTypes = { buffer: Types.buffer, normalize: Types.normalize }
Convolver$1.defaultProps = { buffer: null, normalize: false }

function WaveShaper$1 (props) {
  return Node('WaveShaper', props)
}
WaveShaper$1.propTypes = { curve: Types.curve, oversample: Types.oversample }
WaveShaper$1.defaultProps = { curve: undefined, oversample: 'none' }

function Delay (props) {
  return Node(function (ac) {
    return ac.createDelay(props.maxDelay || props.delayTime || 1)
  }, props)
}
Delay.propTypes = {
  maxDelay: Types.delay,
  delayTime: Types.delay
}

function Node (name, props) {
  return function (ac) {
    var node = isFn$1(name) ? name(ac) : ac['create' + name]()
    return plugProps(ac, node, props)
  }
}

function plugProps (ac, node, props) {
  var value, modulator
  Object.keys(props).forEach(function (propName) {
    value = props[propName]
    switch (typeof value) {
      case 'undefined':
        break // do nothing
      case 'function':
        modulator = value(ac)
        node.nodes = node.nodes || []
        node.nodes.push(modulator)
        plug(propName, modulator, node)
        break
      default:
        plug(propName, value, node)
    }
  })
  return node
}

function NodeBuilder (name, propTypes, defaultProps) {
  function builder (props) {
    return function (ac) {
      var value, modulator
      var node = ac['create' + name]()
      console.log('PROPS', props)
      Object.keys(props).forEach(function (propName) {
        value = props[propName]
        switch (typeof value) {
          case 'undefined':
            break // do nothing
          case 'function':
            modulator = value(ac)
            console.log('modulator', modulator)
            node.nodes = node.nodes || []
            node.nodes.push(modulator)
            plug(propName, modulator, node)
            break
          default:
            plug(propName, value, node)
        }
      })
      return node
    }
  }
  builder.propTypes = propTypes
  builder.defaultProps = defaultProps
  return builder
}

function plug (propName, value, node) {
  var target = node[propName]
  if (isFn$1(value.connect)) {
    target.value = 1
    value.connect(target)
  } else if (target && typeof target.value !== 'undefined') target.value = value
  else node[propName] = value
}

var EMPTY = []

/**
 * Create a connection between nodes. Connections can be in serial or in parallel.
 */
function Connect$1 (props) {
  return function (ac) {
    var nodes = props.nodes.map(initWith(ac)) || EMPTY
    if (nodes.length === 0) return ac.createGain()
    else if (nodes.length === 1) return nodes[0]

    var isSerial = props.type !== 'parallel'
    var node = isSerial ? serial(ac, nodes) : parallel(ac, nodes)
    node.nodes = nodes
    node.duration = isSerial ? maxOf('duration', nodes) : maxIfAll('duration', nodes)
    node.releaseDuration = maxOf('releaseDuration', nodes)
    return node
  }
}
Connect$1.propTypes = {
  type: { type: 'enum', values: ['serial', 'parallel'] },
  feedback: { type: 'number', units: 'gain' },
  nodes: { type: 'array' }
}
Connect$1.defaultProps = { type: 'serial', nodes: EMPTY }

// PRIVATE FUNCTIONS
// =================
function initWith (ac) { return function (synth) { return synth(ac) } }

function serial (ac, nodes) {
  var serial = ac.createGain()
  var last = nodes.reduce(function (src, dest) {
    if (dest.numberOfInputs) src.connect(dest)
    return dest
  }, serial)
  serial.connect = last.connect.bind(last)
  return serial
}

function parallel (ac, nodes) {
  var parallel = ac.createGain()
  var output = ac.createGain()
  nodes.forEach(function (node) {
    if (node.numberOfInputs) parallel.connect(node)
    node.connect(output)
  })
  nodes.push(output) // add to the life cycle controlled nodes
  parallel.connect = output.connect.bind(output)
  return parallel
}

function maxOf (prop, list) {
  return list.reduce(function (memo, o) {
    return Math.max(memo, o[prop] || 0)
  }, 0)
}
function maxIfAll (prop, list) {
  return list.reduce(function (memo, o) {
    return memo && o[prop] ? Math.max(memo, o[prop]) : null
  }, 0.0001)
}

function noop () {}

var Types$1 = {
  contour: { type: 'array' }
}

/**
 * Create an envelope. An envelope is a node with with two funtions: attack
 * and release.
 */
function Envelope$1 (props) {
  return function (ac) {
    var env = ac.createGain()
    env.attack = applyEnvelope(ac, env.gain, props.attack)
    env.release = applyEnvelope(ac, env.gain, props.release)
    env.duration = durationOf(props.attack)
    env.releaseDuration = durationOf(props.release)
    return env
  }
}
Envelope$1.propTypes = {
  attack: Types$1.contour,
  release: Types$1.contour
}
Envelope$1.defaultProps = { attack: [], release: [] }

var EnvTypes = {
  set: 'setValueAtTime',
  lin: 'linearRampToValueAtTime',
  exp: 'exponentialRampToValueAtTime'
}
function applyEnvelope (ac, param, ramps) {
  if (!ramps || ramps.length === 0) return noop
  return function (when) {
    var time = Math.max(ac.currentTime, when || 0)
    each(ramps, function (type, value, dur) {
      var fn = EnvTypes[type] || EnvTypes['lin']
      if (value === 0 && type === 'exp') value = 0.00001
      time += dur
      param[fn](value, time)
    })
  }
}

function durationOf (ramps) {
  var total = 0
  each(ramps, function (type, value, dur) { total += dur })
  return total
}

function each (ramps, cb) {
  if (!ramps) return 0
  var len = ramps.length
  for (var i = 0; i < len; i += 3) {
    cb(ramps[i], ramps[i + 1], ramps[i + 2], i)
  }
}

var isArray$1 = Array.isArray

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
function Buffer$1 (props) {
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
Buffer$1.propsType = {
  attack: seconds,
  decay: seconds,
  reverse: { type: 'boolean' },
  sampleRate: { type: 'number' },
  length: { type: 'number', units: 'samples' },
  duration: seconds,
  numOfChannels: { type: 'number' },
  generator: { type: ['enum', 'function'], values: Object.keys(Generators) }
}
Buffer$1.defaultProps = {
  numOfChannels: 1,
  duration: 1,
  reverse: false,
  attack: 0,
  decay: 0
}

function getGenerator (gen, channel) {
  return isArray$1(gen) ? (gen[channel] || Generators.silence)
  : Generators[gen] || gen || Generators.silence
}

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
function WaveShaperCurve$1 (props) {
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
WaveShaperCurve$1.propTypes = {
  length: { type: 'number' },
  generator: { type: ['enum', 'function'], values: Object.keys(Curves) }
}
WaveShaperCurve$1.defaultProps = {
  length: 1024, generator: 'none'
}

// arbitrary constant for overdrive



var Nodes = Object.freeze({
	Memoize: Memoize,
	Destination: Destination$1,
	Gain: Gain$1,
	Oscillator: Oscillator,
	BiquadFilter: BiquadFilter,
	BufferSource: BufferSource,
	Convolver: Convolver$1,
	WaveShaper: WaveShaper$1,
	Delay: Delay,
	Connect: Connect$1,
	Envelope: Envelope$1,
	Buffer: Buffer$1,
	WaveShaperCurve: WaveShaperCurve$1
});

var isArray = Array.isArray
function noOp () {}
function isFn (x) { return typeof x === 'function' }
function isStr (x) { return typeof x === 'string' }
var EMPTY_OBJ = {}

function Asm (graph) {
  var synth
  if (isGraph(graph)) synth = parseGraph(graph[0], Object.assign({}, graph[1]))
  else if (isFn(graph)) synth = graph
  else throw Error('Not valid graph: ' + graph)

  return function (ac, dest) {
    var node = synth(ac)
    addConnect(node)
    addLifecycle(ac, node)

    if (dest === true) node.connect(ac.destination)
    else if (dest) node.connect(dest)
    return node
  }
}
Asm.builders = Nodes

function isGraph (g) {
  return isArray(g) && g.length === 2 && isStr(g[0])
}

function parseGraph (name, props) {
  props = props || EMPTY_OBJ
  // recursively parse all the graphs from the options object
  Object.keys(props).forEach(function (propName) {
    var prop = props[propName]
    if (isGraph(prop)) props[propName] = parseGraph(prop[0], prop[1])
    else if (isFn(prop)) props[propName] = prop
    else if (isArray(prop)) {
      props[propName] = prop.map(function (prop) {
        return isGraph(prop) ? parseGraph(prop[0], prop[1]) : prop
      })
    }
  })
  if (!Asm.builders[name]) throw Error('Builder not found: ' + name)
  return Asm.builders[name](props)
}

function addConnect (node) {
  var _connect = node.connect
  node.connect = function (dest) {
    _connect.call(node, dest)
    return node
  }
}

function addLifecycle (ac, node) {
  var _start = node.start || noOp
  node.start = function (when, dur) {
    var time = Math.max(ac.currentTime, (when || 0))
    trigger('attack', time, node)
    _start.call(node, time)
    trigger('start', time, node.nodes)

    var duration = dur || node.duration
    if (duration) node.stop(time + duration)
    return node
  }
  var _stop = node.stop || noOp
  node.stop = function (when) {
    var releaseAt = Math.max(ac.currentTime, (when || 0))
    trigger('release', releaseAt, node)

    var stopAt = releaseAt + (node.releaseDuration || 0)
    _stop.call(node, stopAt)
    trigger('stop', stopAt, node.nodes)

    var disconnectAfter = stopAt - ac.currentTime
    setTimeout(function () {
      trigger('disconnect', null, node)
    }, disconnectAfter * 1000 + 1000)
  }
  return node
}

function trigger (event, time, node) {
  if (!node) {
  } else if (isArray(node)) {
    node.forEach(function (n) { trigger(event, time, n) })
  } else {
    if (node[event]) node[event](time)
    if (node.nodes) trigger(event, time, node.nodes)
  }
}

var cache = {}

function MeterCanvas (id, width, height) {
  id = id || ''
  if (!cache[id]) {
    cache[id] = document.createElement('canvas')
    cache[id].width = 600
    cache[id].height = 100
  }
  return cache[id]
}

function Meter (props) {
  return function (ac) {
    var canvas = canvas || MeterCanvas()
    var ctx = canvas.getContext('2d')
    var w = canvas.width
    var h = canvas.height
    var running = false
    var analyser = ac.createAnalyser()
    var spectrum = Spectrum(analyser, w, h)
    var oscilloscope = Oscilloscope(analyser, w, h)
    analyser.fftSize = 1024
    analyser.start = function () {
      console.log('Start meter')
      running = true
      function paint () {
        ctx.clearRect(0, 0, w, h)
        spectrum(ctx)
        oscilloscope(ctx)
        if (running) window.requestAnimationFrame(paint)
      }
      window.requestAnimationFrame(paint)
    }
    return analyser
  }
}

function Spectrum (analyser, width, height) {
  var length = analyser.frequencyBinCount
  var data = new Uint8Array(length)
  var limit = Math.min(width, length)
  var ratio = height / 280
  var barHeight

  return function (ctx) {
    analyser.getByteFrequencyData(data)
    ctx.lineWidth = 0.5
    for (var i = 0; i < limit; i++) {
      barHeight = data[i]
      if (barHeight >= data[i + 1] && barHeight > data[i - 1]) {
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)'
      } else {
        ctx.fillStyle = '#dedede'
      }
      ctx.fillRect(i, height - barHeight * ratio, 1, barHeight * ratio)
    }
  }
}

function Oscilloscope (analyser, width, height) {
  var zero, x
  var length = analyser.frequencyBinCount
  var limit = Math.min(length, width)
  var buffer = new Uint8Array(length)
  var scaling = height / 256

  return function draw (ctx) {
    analyser.getByteTimeDomainData(buffer)
    ctx.lineWidth = 0.5
    ctx.beginPath()
    zero = findFirstPositiveZeroCrossing(buffer, limit)
    for (x = 0; x < limit; x++) {
      ctx.lineTo(x, (256 - buffer[x + zero]) * scaling)
    }
    ctx.stroke()
  }
}

var ZERO = 128
var MINVAL = ZERO + 6

function findFirstPositiveZeroCrossing (buf, length) {
  var i = 0
  var lastZero = -1

  // advance until we're zero or negative
  while (i < length && buf[i] > ZERO) i++

  if (i >= length) return 0

  // advance until we're above MINVAL, keeping track of last zero.
  while (i < length && buf[i] < MINVAL) {
    if (buf[i] >= 128 && lastZero === -1) {
      lastZero = i
    }
    i++
  }

  // we may have jumped over MINVAL in one sample.
  if (lastZero === -1) lastZero = i

  if (i === length) return 0  // We didn't find any positive zero crossings

  return lastZero
}


var Meter$1 = Object.freeze({
  MeterCanvas: MeterCanvas,
  Meter: Meter
});

function SynthKit (ac, synth, dest) {
  return Asm(synth)(ac, dest)
}
exportTo(Kit, SynthKit)
exportTo(Meter$1, SynthKit)
SynthKit.live = function () { exportTo(SynthKit, window) }

function exportTo (kit, dest) {
  Object.keys(kit).forEach(function (name) {
    dest[name] = kit[name]
  })
}

return SynthKit;

})));