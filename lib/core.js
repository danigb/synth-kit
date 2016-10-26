import { ac, isNum, lifecycle, plug, samplingRate } from './utils'
var slice = Array.prototype.slice
var isArray = Array.isArray

// ROUTING
// =======

/**
 * Connect nodes in series: A -> B -> C -> D
 * @param {Array<AudioNode>} nodes - the list of nodes to be connected
 * @return {AudioNode} the resulting audio node
 */
export function connect (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments)
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var first = nodes[0]
  var last = nodes.reduce(function (src, dest) {
    src.connect(dest)
    return dest
  })
  first.connect = last.connect.bind(last)
  return lifecycle(first, nodes.slice(1))
}

/**
 * Connect nodes in parallel
 */
export function add (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments)
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var context = nodes[0].context
  var input = context.createGain()
  var output = context.createGain()
  nodes.forEach(function (node) {
    if (node.numberOfInputs) input.connect(node)
    node.connect(output)
  })
  input.connect = output.connect.bind(output)
  return lifecycle(input, nodes)
}

// SIGNALS
// =======

/**
 * Create a constant signal
 * @param {Integer} value - the value of the constant
 * @return {AudioNode} the audio node
 */
export function constant (value, context) {
  var ctx = context || ac
  var source = ctx.createBufferSource()
  source.loop = true
  source.buffer = ctx.createBuffer(1, 2, samplingRate(context))
  var data = source.buffer.getChannelData(0)
  data[0] = data[1] = value
  return source
}

/**
 * Create a gain
 */
export function gain (gain, context) {
  var amp = (context || ac).createGain()
  return lifecycle(amp, [
    plug('gain', gain, amp)
  ])
}

/**
 * Multiply a signal
 */
export function mult (value, signal) {
  return connect(signal, gain(value))
}

/**
 * Scale a signal
 */
export function scale (min, max, source, ctx) {
  if (source.numberOfInputs) source = connect(constant(1, ctx), source)
  var delta = max - min
  return add(constant(min, ctx), mult(delta, source))
}

// OSCILLATORS
// ===========

/**
 * Create an oscillator
 */
export function osc (type, frequency, detune, context) {
  var osc = (context || ac).createOscillator()
  osc.type = type
  return lifecycle(osc, [
    plug('frequency', frequency, osc),
    plug('detune', detune, osc)
  ])
}
export const sine = osc.bind(null, 'sine')
export const saw = osc.bind(null, 'sawtooth')
export const square = osc.bind(null, 'square')
export const triangle = osc.bind(null, 'triangle')

/**
 * Create an oscillator bank
 */
export function oscBank (base, freqs, gains, types) {
  var g, src
  if (!isNum(base)) base = 440
  if (!isArray(freqs)) freqs = [ 1 ]
  if (!isArray(gains)) gains = [ 1 ]
  if (!isArray(types)) types = [ 'sine' ]

  var tl = types.length
  var gl = gains.length
  return add(freqs.map(function (freq, i) {
    src = osc(types[i % tl], base * freq)
    g = gains[i % gl]
    return g === 1 ? src : connect(src, gain(g))
  }))
}

// FILTERS
// =======

/**
 * Create a filter
 */
export function filter (type, frequency, Q, detune, context) {
  var filter = (context || ac).createBiquadFilter()
  filter.type = type
  return lifecycle(filter, [
    plug('frequency', frequency, filter),
    plug('Q', Q, filter),
    plug('detune', detune, filter)
  ])
}
export const lowpass = filter.bind(null, 'lowpass')
export const hipass = filter.bind(null, 'highpass')
export const bandpass = filter.bind(null, 'hipass')

// MODULATORS
// ==========

/**
 * Detune modulator. Can be connected to any `detune` param.
 * @example
 * sine(300, detune(50, tempo(20)))
 */
export function detune (cents, rate, type, ctx) {
  if (!isNum(cents)) cents = 50
  if (!isNum(rate)) rate = 10
  if (!type) type = 'sine'
  return mult(cents, osc(type, rate, ctx))
}
