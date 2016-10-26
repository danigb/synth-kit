(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SynthKit = global.SynthKit || {})));
}(this, (function (exports) { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var window_1 = createCommonjsModule(function (module) {
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof commonjsGlobal !== "undefined") {
    module.exports = commonjsGlobal;
} else {
    module.exports = {};
}
});

var index = createCommonjsModule(function (module) {
var window = window_1;

var Context = window.AudioContext || window.webkitAudioContext;
if (Context) module.exports = new Context;
});

function isNum (n) { return typeof n === 'number' }
function isFn (x) { return typeof x === 'function' }

var ac = index;

// CONVERSION
// ==========

/**
 * Convert from seconds to samples (using AudioContext sampling rate)
 * @param {Float} seconds - the number of seconds
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the number of samples
 * @example
 * white(dur(1.2)) // => generate 1.2seconds of white noise
 */


/**
 * Convert from beats per minute to hertzs
 * @param {Integer} bpm - the tempo
 * @param {Integer} sub - (Optional) subdivision (default 1)
 * @return {Float} the tempo expressed in hertzs
 */


/**
 * Get audio context's current time
 */
function now (context) { return (context || ac).currentTime }

/**
 * Get sampling rate
 */
function samplingRate (context) { return (context || ac).sampleRate }

/**
 * Plug something (a value, a node) into a node parameter
 */
function plug (name, value, node) {
  if (typeof value === 'undefined') {
    // do nothing
  } else if (typeof value.connect === 'function') {
    node[name].value = 0;
    value.connect(node[name]);
    return value
  } else if (node[name]) {
    node[name].value = value;
  }
}

// TODO: export?
// Get time for a given `when` and  `delay` parameters
function toTime (context, when, delay) {
  return Math.max(context.currentTime, when || 0) + (delay || 0)
}

function bindLifecycle (node) {
  return {
    connect: node.connect ? node.connect.bind(node) : null,
    disconnect: node.disconnect ? node.disconnect.bind(node) : null,
    start: node.start ? node.start.bind(node) : null,
    stop: node.stop ? node.stop.bind(node) : null
  }
}

function dispatch (event, value, node, dependents) {
  if (node[event]) node[event](value);
  dependents.forEach(function (dep) {
    if (dep && dep[event]) dep[event](value);
  });
  return node
}

/**
 * Override node functions to handle better the node's lifecycle
 */
function lifecycle (node, dependents) {
  var raw = bindLifecycle(node);

  node.connected = false;
  node.connect = function (dest) {
    node.connected = true;
    raw.connect(dest);
    return node
  };
  node.disconnect = function () {
    node.connected = false;
    dispatch('disconnect', null, raw, dependents);
  };
  node.start = function (when, delay, duration) {
    var time = toTime(node.context, when, delay);
    if (!node.connected) node.connect(node.context.destination);
    dispatch('start', time, raw, dependents);
    if (duration) node.stop(time + duration);
    return node
  };
  node.stop = function (when, delay) {
    var time = toTime(node.context, when, delay);
    dispatch('stop', time, raw, dependents);
  };
  return node
}

var slice = Array.prototype.slice;
var isArray = Array.isArray;

// ROUTING
// =======

/**
 * Connect nodes in series: A -> B -> C -> D
 * @param {Array<AudioNode>} nodes - the list of nodes to be connected
 * @return {AudioNode} the resulting audio node
 */
function connect (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments);
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var first = nodes[0];
  var last = nodes.reduce(function (src, dest) {
    src.connect(dest);
    return dest
  });
  first.connect = last.connect.bind(last);
  return lifecycle(first, nodes.slice(1))
}

/**
 * Connect nodes in parallel
 */
function add (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments);
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var context = nodes[0].context;
  var input = context.createGain();
  var output = context.createGain();
  nodes.forEach(function (node) {
    if (node.numberOfInputs) input.connect(node);
    node.connect(output);
  });
  input.connect = output.connect.bind(output);
  return lifecycle(input, nodes)
}

// SIGNALS
// =======

/**
 * Create a constant signal
 * @param {Integer} value - the value of the constant
 * @return {AudioNode} the audio node
 */
function constant (value, context) {
  var ctx = context || ac;
  var source = ctx.createBufferSource();
  source.loop = true;
  source.buffer = ctx.createBuffer(1, 2, samplingRate(context));
  var data = source.buffer.getChannelData(0);
  data[0] = data[1] = value;
  return source
}

/**
 * Create a gain
 */
function gain (gain, context) {
  var amp = (context || ac).createGain();
  return lifecycle(amp, [
    plug('gain', gain, amp)
  ])
}

/**
 * Multiply a signal
 */
function mult (value, signal) {
  return connect(signal, gain(value))
}

/**
 * Scale a signal
 */
function scale (min, max, source, ctx) {
  if (source.numberOfInputs) source = connect(constant(1, ctx), source);
  var delta = max - min;
  return add(constant(min, ctx), mult(delta, source))
}

// OSCILLATORS
// ===========

/**
 * Create an oscillator
 */
function osc (type, frequency, detune, context) {
  var osc = (context || ac).createOscillator();
  osc.type = type;
  return lifecycle(osc, [
    plug('frequency', frequency, osc),
    plug('detune', detune, osc)
  ])
}
const sine = osc.bind(null, 'sine');
const saw = osc.bind(null, 'sawtooth');
const square = osc.bind(null, 'square');
const triangle = osc.bind(null, 'triangle');

/**
 * Create an oscillator bank
 */


// FILTERS
// =======

/**
 * Create a filter
 */
function filter (type, frequency, Q, detune, context) {
  var filter = (context || ac).createBiquadFilter();
  filter.type = type;
  return lifecycle(filter, [
    plug('frequency', frequency, filter),
    plug('Q', Q, filter),
    plug('detune', detune, filter)
  ])
}
const lowpass = filter.bind(null, 'lowpass');
const hipass = filter.bind(null, 'highpass');
const bandpass = filter.bind(null, 'hipass');

// MODULATORS
// ==========

/**
 * Detune modulator. Can be connected to any `detune` param.
 * @example
 * sine(300, detune(50, tempo(20)))
 */
function detune (cents, rate, type, ctx) {
  if (!isNum(cents)) cents = 50;
  if (!isNum(rate)) rate = 10;
  if (!type) type = 'sine';
  return mult(cents, osc(type, rate, ctx))
}

/**
 * Create a buffer source (sample player)
 */
function sample (buffer, loop, detune, context) {
  var src = (context || ac).createBufferSource();
  src.buffer = isFn(buffer) ? buffer() : buffer;
  src.loop = loop;
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
function buffer (generators, samples, reverse, context) {
  return function () {
    var data, generator, numOfChannels, n, ch, i;

    if (!Array.isArray(generators)) generators = [ generators ];
    samples = samples || 0;
    reverse = reverse === true;
    numOfChannels = generators.length;
    if (!context) context = ac;

    var buffer = context.createBuffer(numOfChannels, samples, samplingRate(context));
    for (ch = 0; ch < numOfChannels; ch++) {
      data = buffer.getChannelData(0);
      generator = generators[ch];
      for (i = 0; i < samples; i++) {
        n = reverse ? samples - i : i;
        data[i] = generator(n, data[i - 1], samples);
      }
    }
    return buffer
  }
}

/**
 * Generate white noise
 */
function white (samples, loop, context) {
  if (!isNum(samples)) samples = samplingRate(context);
  loop = loop !== false;
  return sample(buffer(noiseGen, samples, false, context), loop, 0, context)
}
function noiseGen () { return Math.random() * 2 - 1 }

function schedule (param, shape, times, types, context) {
  return function (when, delay) {
    console.log(shape, times, types);
    var type;
    var time = toTime(context, when, delay);
    var lt = times.length;
    var tp = types.length;
    shape.forEach(function (value, i) {
      time += times[i % lt];
      type = types[i % tp];
      console.log(value, time, type);
      if (type === 'set') param.setValueAtTime(value, time);
      else if (type === 'exp') param.exponentialRampToValueAtTime(value === 0 ? 0.00001 : value, time);
      else param.linearRampToValueAtTime(value, time);
    });
  }
}

function env (shape, times, types, context) {
  var gain = (context || ac).createGain();
  gain.gain.value = 0;
  gain.start = schedule(gain.gain, shape, times, types, context || ac);
  return gain
}

/**
 * An attack-hold-decay envelope
 */
function ahd (attack, hold, decay, context) {
  if (!isNum(attack)) attack = 0.01;
  if (!isNum(hold)) hold = 0;
  if (!isNum(decay)) decay = 0.25;
  return env([0, 1, 1, 0],
    [0, attack, hold, decay],
    ['set', 'lin', 'set', 'exp'], context)
}

/**
 * An attack-decay envelope
 */
function perc (attack, decay, context) {
  return ahd(attack, 0, decay, context)
}

function mix (wet, fx) {
  if (!isNum(wet)) wet = 0.5;
  return add(gain(1 - 0.5), connect(fx, gain(wet)))
}

function tremolo (rate, type, ctx) {
  type = type || 'sine';
  return gain(osc(type, rate, ctx), ctx)
}

function dly (time, context) {
  var dly = (context || ac).createDelay(5);
  return lifecycle(dly, [
    plug('delayTime', time, dly)
  ])
}

function live () {
  Object.keys(window.SynthKit).forEach(function (name) {
    window[name] = window.SynthKit[name];
  });
}

exports.live = live;
exports.connect = connect;
exports.add = add;
exports.constant = constant;
exports.gain = gain;
exports.mult = mult;
exports.scale = scale;
exports.osc = osc;
exports.sine = sine;
exports.saw = saw;
exports.square = square;
exports.triangle = triangle;
exports.filter = filter;
exports.lowpass = lowpass;
exports.hipass = hipass;
exports.bandpass = bandpass;
exports.detune = detune;
exports.buffer = buffer;
exports.sample = sample;
exports.white = white;
exports.ahd = ahd;
exports.perc = perc;
exports.samplingRate = samplingRate;
exports.now = now;
exports.mix = mix;
exports.tremolo = tremolo;
exports.dly = dly;

Object.defineProperty(exports, '__esModule', { value: true });

})));
