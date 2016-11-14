(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
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

/**
 * In synth-kit most of the functions accepts an optional AudioContext as
 * last parameter. If no one is provided, synth-kit creates a singleton
 * AudioContext using ['audio-context'](npmjs.com/package/audio-context) module.
 *
 * @module context
 */
// Shim to make connect chainable (soon to be implemented native)
var proto = Object.getPrototypeOf(Object.getPrototypeOf(index.createGain()));
var _connect = proto.connect;
proto.connect = function () {
  _connect.apply(this, arguments);
  console.log('connect!', this, arguments[0]);
  return this
};

/**
 * Get the audio context.
 * @param {AudioContext} context - (Optional) if given, it return itself. If
 * nothing passed, it returns the AudioContext singleton instance
 * @return {AudioContext} the audio context
 * @example
 * // normally you won't do this:
 * var gain = context().createGain()
 */
function context (ctx) { return ctx || index }

/**
 * Get the audio context's destination
 * @param {AudioContext} context - (Optional) an alternate audio context
 * @return {AudioContext} the audio context destination
 * @example
 * conn(sine(300), dest()).start()
 */
function dest (context) { return (context || index).destination }

/**
 * Get audio context's current time
 * @param {AudioContext} context - (Optional) an optional audio context
 * @return {Number} the time in seconds relative to the AudioContext creation
 * @example
 * now() // => 3.3213
 */
function now (context) { return (context || index).currentTime }

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
function when (time, delay, ctx) {
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
var after = when.bind(0);

/**
 * Get audio context sampling rate
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the context's sampling rate
 * @example
 * samplingRate() // => 44100
 */
function samplingRate (ctx) { return context(ctx).sampleRate }

/**
 * Convert from seconds to samples (using AudioContext sampling rate)
 * @param {Float} seconds - the number of seconds
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the number of samples
 * @example
 * white(seconds(1.2)) // => generate 1.2 seconds of white noise
 */
function timeToSamples (secs, context) { return secs * samplingRate(context) }

// util
function fillStr (s, num) { return Array(num + 1).join(s) }
function isNum (x) { return typeof x === 'number' }
function isStr (x) { return typeof x === 'string' }
function isDef (x) { return typeof x !== 'undefined' }
function midiToFreq (midi, tuning) {
  return Math.pow(2, (midi - 69) / 12) * (tuning || 440)
}

var REGEX = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/;
/**
 * A regex for matching note strings in scientific notation.
 *
 * @name regex
 * @function
 * @return {RegExp} the regexp used to parse the note name
 *
 * The note string should have the form `letter[accidentals][octave][element]`
 * where:
 *
 * - letter: (Required) is a letter from A to G either upper or lower case
 * - accidentals: (Optional) can be one or more `b` (flats), `#` (sharps) or `x` (double sharps).
 * They can NOT be mixed.
 * - octave: (Optional) a positive or negative integer
 * - element: (Optional) additionally anything after the duration is considered to
 * be the element name (for example: 'C2 dorian')
 *
 * The executed regex contains (by array index):
 *
 * - 0: the complete string
 * - 1: the note letter
 * - 2: the optional accidentals
 * - 3: the optional octave
 * - 4: the rest of the string (trimmed)
 *
 * @example
 * var parser = require('note-parser')
 * parser.regex.exec('c#4')
 * // => ['c#4', 'c', '#', '4', '']
 * parser.regex.exec('c#4 major')
 * // => ['c#4major', 'c', '#', '4', 'major']
 * parser.regex().exec('CMaj7')
 * // => ['CMaj7', 'C', '', '', 'Maj7']
 */
function regex () { return REGEX }

var SEMITONES = [0, 2, 4, 5, 7, 9, 11];
/**
 * Parse a note name in scientific notation an return it's components,
 * and some numeric properties including midi number and frequency.
 *
 * @name parse
 * @function
 * @param {String} note - the note string to be parsed
 * @param {Boolean} isTonic - true the strings it's supposed to contain a note number
 * and some category (for example an scale: 'C# major'). It's false by default,
 * but when true, en extra tonicOf property is returned with the category ('major')
 * @param {Float} tunning - The frequency of A4 note to calculate frequencies.
 * By default it 440.
 * @return {Object} the parsed note name or null if not a valid note
 *
 * The parsed note name object will ALWAYS contains:
 * - letter: the uppercase letter of the note
 * - acc: the accidentals of the note (only sharps or flats)
 * - pc: the pitch class (letter + acc)
 * - step: s a numeric representation of the letter. It's an integer from 0 to 6
 * where 0 = C, 1 = D ... 6 = B
 * - alt: a numeric representation of the accidentals. 0 means no alteration,
 * positive numbers are for sharps and negative for flats
 * - chroma: a numeric representation of the pitch class. It's like midi for
 * pitch classes. 0 = C, 1 = C#, 2 = D ... 11 = B. Can be used to find enharmonics
 * since, for example, chroma of 'Cb' and 'B' are both 11
 *
 * If the note has octave, the parser object will contain:
 * - oct: the octave number (as integer)
 * - midi: the midi number
 * - freq: the frequency (using tuning parameter as base)
 *
 * If the parameter `isTonic` is set to true, the parsed object will contain:
 * - tonicOf: the rest of the string that follows note name (left and right trimmed)
 *
 * @example
 * var parse = require('note-parser').parse
 * parse('Cb4')
 * // => { letter: 'C', acc: 'b', pc: 'Cb', step: 0, alt: -1, chroma: -1,
 *         oct: 4, midi: 59, freq: 246.94165062806206 }
 * // if no octave, no midi, no freq
 * parse('fx')
 * // => { letter: 'F', acc: '##', pc: 'F##', step: 3, alt: 2, chroma: 7 })
 */
function parse (str, isTonic, tuning) {
  if (typeof str !== 'string') return null
  var m = REGEX.exec(str);
  if (!m || !isTonic && m[4]) return null

  var p = { letter: m[1].toUpperCase(), acc: m[2].replace(/x/g, '##') };
  p.pc = p.letter + p.acc;
  p.step = (p.letter.charCodeAt(0) + 3) % 7;
  p.alt = p.acc[0] === 'b' ? -p.acc.length : p.acc.length;
  var pos = SEMITONES[p.step] + p.alt;
  p.chroma = pos < 0 ? 12 + pos : pos % 12;
  if (m[3]) { // has octave
    p.oct = +m[3];
    p.midi = pos + 12 * (p.oct + 1);
    p.freq = midiToFreq(p.midi, tuning);
  }
  if (isTonic) p.tonicOf = m[4];
  return p
}

var LETTERS = 'CDEFGAB';
function acc (n) { return !isNum(n) ? '' : n < 0 ? fillStr('b', -n) : fillStr('#', n) }
function oct (n) { return !isNum(n) ? '' : '' + n }

/**
 * Create a string from a parsed object or `step, alteration, octave` parameters
 * @param {Object} obj - the parsed data object
 * @return {String} a note string or null if not valid parameters
 * @since 1.2
 * @example
 * parser.build(parser.parse('cb2')) // => 'Cb2'
 *
 * @example
 * // it accepts (step, alteration, octave) parameters:
 * parser.build(3) // => 'F'
 * parser.build(3, -1) // => 'Fb'
 * parser.build(3, -1, 4) // => 'Fb4'
 */
function build (s, a, o) {
  if (s === null || typeof s === 'undefined') return null
  if (s.step) return build(s.step, s.alt, s.oct)
  if (s < 0 || s > 6) return null
  return LETTERS.charAt(s) + acc(a) + oct(o)
}

/**
 * Get midi of a note
 *
 * @name midi
 * @function
 * @param {String|Integer} note - the note name or midi number
 * @return {Integer} the midi number of the note or null if not a valid note
 * or the note does NOT contains octave
 * @example
 * var parser = require('note-parser')
 * parser.midi('A4') // => 69
 * parser.midi('A') // => null
 * @example
 * // midi numbers are bypassed (even as strings)
 * parser.midi(60) // => 60
 * parser.midi('60') // => 60
 */
function midi (note) {
  if ((isNum(note) || isStr(note)) && note >= 0 && note < 128) return +note
  var p = parse(note);
  return p && isDef(p.midi) ? p.midi : null
}

/**
 * Get freq of a note in hertzs (in a well tempered 440Hz A4)
 *
 * @name freq
 * @function
 * @param {String} note - the note name or note midi number
 * @param {String} tuning - (Optional) the A4 frequency (440 by default)
 * @return {Float} the freq of the number if hertzs or null if not valid note
 * @example
 * var parser = require('note-parser')
 * parser.freq('A4') // => 440
 * parser.freq('A') // => null
 * @example
 * // can change tuning (440 by default)
 * parser.freq('A4', 444) // => 444
 * parser.freq('A3', 444) // => 222
 * @example
 * // it accepts midi numbers (as numbers and as strings)
 * parser.freq(69) // => 440
 * parser.freq('69', 442) // => 442
 */
function freq (note, tuning) {
  var m = midi(note);
  return m === null ? null : midiToFreq(m, tuning)
}

var parser = { parse: parse, build: build, regex: regex, midi: midi, freq: freq };
// add additional functions, one for each object property
var FNS = ['letter', 'acc', 'pc', 'step', 'alt', 'chroma', 'oct'];
FNS.forEach(function (name) {
  parser[name] = function (src) {
    var p = parse(src);
    return p && isDef(p[name]) ? p[name] : null
  };
});

var index$1 = parser;

var pow = Math.pow;

/**
 * Convert from beats per minute to hertzs
 * @param {Integer} bpm - the tempo
 * @param {Integer} sub - (Optional) subdivision (default 1)
 * @return {Float} the tempo expressed in hertzs
 */
function tempo (bpm, sub) { return (bpm / 60) * (sub || 1) }

/**
 * Get frequency of a note. The note can be a note name in scientific
 * notation (for example: 'C#2') or a midi number
 */
function note (name, base) {
  return index$1.freq(name)
}

function hz (value, base) {
  if (typeof value === 'string') {
    base = base || 440;
    return pow(2, (+value - 69) / 12) * base
  } else {
    return Math.abs(+value)
  }
}

/**
 *  Convert decibels into gain.
 *  @param  {Number} db
 *  @return {Number} the gain (from 0 to 1)
 */
function dBToGain (db) { return pow(2, db / 6) }

/**
 *  Convert gain to decibels.
 *  @param  {Number} gain (0-1)
 *  @return {Decibels}
 */
function gainToDb (gain) { return 20 * (Math.log(gain) / Math.LN10) }

/**
 * Simple utilities shared between all the modules
 * @module utils
 * @private
 */

/**
 * Empty options object (treat is as immutable)
 * @private
 */
var OPTS = {};

/**
 * typeof shortcut
 * @private
 */
function isA (t, x) { return typeof x === t }

/**
 * Ensure the value is an array
 * @private
 */
function toArr (arr) { return Array.isArray(arr) ? arr : [ arr ] }

/**
 * The array.slice function unbinded
 * @private
 */
var slice = Array.prototype.slice;

/**
 * Test if its an array
 * @private
 */
var isArray = Array.isArray;

/**
 * Object.assign function
 * @private
 */
var assign = Object.assign;

/**
 * Poor man's pluck
 * @private
 */

/**
 * This module provides two ways to route nodes:
 *
 * - In series: A -> B -> C -> D, using the `connect` function
 * - In parallel: in -> [A, B, C] -> out, using the `add` function
 * @module routing
 */

/**
 * Connect nodes in series: A -> B -> C -> D.
 * @param {Array<AudioNode>} nodes - the list of nodes to be connected
 * @return {AudioNode} the resulting audio node
 */
function conn (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments);
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var node = nodes[0];
  if (!node.duration) node.duration = 0;
  var last = nodes.reduce(function (src, dest$$1) {
    src.connect(dest$$1);
    node.duration = Math.max(node.duration, dest$$1.duration || 0);
    return dest$$1
  });
  overrideConnect(node, last);
  var startables = nodes.slice(1).filter(isStartable);
  if (startables.length) {
    var _start = node.start;
    node.start = function (time) {
      if (_start) _start.call(node, time);
      startables.forEach(function (node) { node.start(time); });
      if (node.duration) node.stop(time + node.duration);
    };
    var _stop = node.stop;
    node.stop = function (time) {
      var t = 0;
      startables.reverse();
      startables.forEach(function (node) {
        t = t || when(time, null, node.context);
        node.stop(t);
        t += node.release || 0;
      });
      if (_stop) _stop.call(node, t);
    };
  }
  return node
}

// TODO: A RESOLVER: add debe tener onended cuando acaben todos sus nodos
/**
 * Connect nodes in parallel in order to add signals. This is one of the
 * routing functions (the other is `connect`).
 * @param {...AudioNode} nodes - the nodes to be connected
 * @return {AudioNode} the resulting audio node
 * @example
 * add(sine(400), sine(401)).start()
 */
function add (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments);
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var context$$1 = nodes[0].context;
  var input = context$$1.createGain();
  input.id = 'ADDin';
  var output = context$$1.createGain();
  output.id = 'ADDout';
  // the connection loop: connect input to all nodes. all nodes to output.
  nodes.forEach(function (node) {
    if (node.numberOfInputs) input.connect(node);
    node.connect(output);
  });
  // this must be after the connection loop
  overrideConnect(input, output);
  var node = lifecycle(input, nodes);
  addOnEndedEvent(node);
  return node
}

// make trigger an onended event when all startable node ended
function addOnEndedEvent (node) {
  if (!node.dependents) return
  var length = node.dependents.length;
  function triggerEnded () {
    length--;
    if (!length && node.onended) node.onended();
  }
  node.dependents.forEach(function (node) {
    node.onended = triggerEnded;
  });
}

// overrides the node's connect function to use output node
function overrideConnect (node, output) {
  node.output = node;
  node.connect = function (dest$$1) {
    output.connect(dest$$1);
    return node
  };
  return node
}

/**
 * Return if a node is startable or note
 * @private
 */
function isStartable (node) { return node && typeof node.start === 'function' }

/**
 * Plug something (a value, a node) into a node parameter
 * @param {String} name - the parameter name
 * @param {AudioNode|Object} value - the value (can be a signal)
 * @param {AudioNode} target - the target audio node
 * @return {AudioNode} the modulator signal if any or undefined
 * @private
 */
function plug (name, value, node) {
  if (typeof value === 'undefined') {
    // do nothing
  } else if (typeof value.connect === 'function') {
    node[name].value = 0;
    value.conn(node[name]);
    return value
  } else if (node[name]) {
    node[name].value = value;
  }
}

/**
 * Override start and stop functions (if necessary) to handle node dependencies
 * lifecycle.
 * @private
 */
function lifecycle (node, dependents) {
  dependents = dependents.filter(isStartable);
  if (dependents.length) {
    var _start = node.start;
    var _stop = node.stop;
    node.start = function (time) {
      var res = _start ? _start.call(node, time) : void 0;
      dependents.forEach(function (d) { if (d.start) d.start(time); });
      if (node.start.then) node.start.then(time, node, dependents);
      return res
    };
    node.stop = function (time) {
      var res = _stop ? _stop.call(node, time) : void 0;
      dependents.forEach(function (d) { if (d.stop) d.stop(time); });
      return res
    };
    node.dependents = dependents;
  }
  return node
}

/** @module signals */

/**
 * Create a gain node
 * @param {Float|AudioNode} gain - the gain value or modulator
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @return {AudioNode} the gain node
 * @example
 * conn(sine(440), gain(0.3))
 * @example
 * // with modulation (kind of tremolo)
 * conn(sine(400), gain(sine(10)))
 * @example
 * using a configuration object
 * gain({ gain: 0.5, context: <AudioContext> })
 */
function gain (gain, opts) {
  if (arguments.length === 1 && !isA('number', gain)) return gain(gain.gain, gain)
  var node = context(opts ? opts.context : null).createGain();
  return lifecycle(node, [
    plug('gain', gain, node)
  ])
}

/**
 * Create a constant signal. Normally you will use it in combination with
 * envelopes or modulators.
 *
 * @param {Integer} value - the value of the constant
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @return {AudioNode} the constant audio node
 * @example
 * sine(constant(440)).start()
 */
function constant (value, o) {
  // TODO: cache buffer
  var ctx = context(o ? o.context : null);
  var source = ctx.createBufferSource();
  source.loop = true;
  source.buffer = ctx.createBuffer(1, 2, ctx.sampleRate);
  var data = source.buffer.getChannelData(0);
  data[0] = data[1] = value;
  return source
}

/**
 * Create a signal source. You will use signals to change parameters of a
 * audio node after starting. See example.
 * @param {Integer} value - the value of the constant
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @return {AudioParam} the constant audio node
 * @example
 * var freq = signal(440)
 * sine(freq).start()
 * freq.value.linearRampToValueAtTime(880, after(5))
 */
function signal (value, opts) {
  var signal = gain(value, opts);
  conn(constant(1, opts), signal).start();
  signal.signal = signal.gain;
  return signal
}

/**
 * Create a node that bypasses the signal
 * @param {AudioContext} context - (Optional) the audio context
 * @return {AudioNode} the bypass audio node
 * @example
 * conn(sine(300), add(bypass(), dly(0.2)))
 */
function bypass (o) {
  return context(o ? o.context : null).createGain()
}

/**
 * Multiply a signal.
 * @param {Integer|AudioNode} value - the value
 * @param {AudioNode} signal - the signal to multiply by
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use to create the signal
 *
 * @example
 * // a vibrato effect
 * sine(440, { detune: mult(500, sine(tempo(160))) })
 */
function mult (value, signal, opts) {
  if (isA('number', signal)) return value * signal
  return conn(signal, gain(value, opts))
}

/**
 * Scale a signal. Given a signal (between -1 and 1) scale it to fit in a range.
 * @param {Integer} min - the minimum of the range
 * @param {Integer} max - the minimum of the range
 * @param {AudioNode} source - the signal to scale
 * @return {AudioNode} the scaled signal node
 * @example
 * // create a frequency envelope between 440 and 880 Hz
 * sine(scale(440, 880, adsr(0.1, 0.01, 1, 1)))
 */
function scale (min, max, source) {
  var ctx = source;
  if (source.numberOfInputs) source = conn(constant(1, ctx), source);
  var delta = max - min;
  return add(constant(min, ctx), mult(delta, source))
}

/**
 * This module provides a concise API over the AudioContext's createOscillator
 * function
 * @example
 * import { sine, lfo, Hz, master } from 'synth-kit'
 *
 * master.start(sine(Hz('A4'), { detune: lfo(5, 10) }))
 * @module oscillators
 */
/**
 * Create an oscillator (an OscillatorNode)
 * @param {String} type - one of OscillatorNode [types]()
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) Options can include:
 *
 * - detune: the detune in cents. Can be a number or a signal (see example)
 * - context: the audio context to use
 *
 * @return {AudioNode} the oscillator
 * @example
 * osc('sine', 880)
 * osc('square', 880, { detune: -10 })
 * osc('sawtooth', 1600, { detune: lfo(5, 50) }
 * // any signal can be the detune modulator
 * osc('sawtooth', 1600, { detune: conn(...) }
 */
function osc (type, frequency, o) {
  if (!o) o = OPTS;
  var osc = context(o.context).createOscillator();
  osc.type = type || 'sine';
  return lifecycle(osc, [
    plug('frequency', frequency, osc),
    plug('detune', o.detune, osc)
  ])
}
/**
 * Create a sine oscillator. An alias for `osc('sine', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} frequency - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * sine(1760)
 * sine(800, { detune: -50 })
 */
const sine = osc.bind(null, 'sine');
/**
 * Create a sawtooth oscillator. An alias for `osc('sawtooth', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * saw(1760)
 * saw(440, { detune: lfo(5, 10) })
 */
const saw = osc.bind(null, 'sawtooth');
/**
 * Create a square oscillator. An alias for `osc('square', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * square(1760, { context: offline() })
 */
const square = osc.bind(null, 'square');
/**
 * Create a triangle oscillator. An alias for `osc('triangle', ...)`
 * @function
 * @see osc
 * @param {Float|AudioNode} - the frequency (can be a number or a signal)
 * @param {Object} options - (Optional) same as `osc` options
 * @return {AudioNode} the oscillator
 * @example
 * triangle(1760, { detune: -10 })
 */
const triangle = osc.bind(null, 'triangle');

/**
 * Create a lfo. It's a decorated oscillator with some goodies to reduce
 * the boilerplate code with signal modulators
 *
 * @param {Integer} freq - the frequency
 * @param {Integer} amplitude - the amplitude
 * @param {Options} options - (Optional) Options can include:
 *
 * - context: the audio context to be used
 * - tempo: if provided, the freq parameter is the number of beats inside that tempo
 *
 * @example
 * master.start(sine(300, { detune: lfo(5, 10) }))
 * // too complicated?
 * master.start(sine(300, { detune: lfo(4, 10, { tempo: 120 }))
 */
function lfo (freq, amp, o) {
  freq = freq || 7;
  amp = amp || 1;
  o = o || OPTS;
  if (o.tempo) freq = tempo(o.tempo, freq);
  return mult(amp, osc(o.type || 'sine', freq))
}

/** @module filters */
/**
 * Create a filter (a [BiquadFilterNode](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode))
 *
 * @param {String} type - the filter [type](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type)
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) options may include:
 *
 * - detune: the detune of the frequency in cents (can be a number or a signal)
 * - Q: the Q of the filter (can be a number or a signal)
 * - context: the audio context to use
 *
 * @return {AudioNode} the filter
 * @example
 * conn(square(800), filter('lowpass', 400))
 */
function filter (type, frequency, o) {
  if (isA('object', type)) {
    o = type; type = o.type; frequency = o.frequency;
  }
  o = o || OPTS;
  var filter = context(o.context).createBiquadFilter();
  filter.type = type || 'lowpass';
  return lifecycle(filter, [
    plug('frequency', frequency, filter),
    plug('Q', o.Q, filter),
    plug('detune', o.detune, filter)
  ])
}

/**
 * Create a lowpass filter. An alias for `filter('lowpass', ...)`
 *
 * @function
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) the same options as `filter` function
 * @return {AudioNode} the lowpass filter
 * @example
 * conn(square(800), lowpass(400))
 * @see filter
 */
const lowpass = filter.bind(null, 'lowpass');

/**
 * Create a hipass filter. An alias for `filter('hipass', ...)`
 *
 * @function
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) the same options as `filter` function
 * @return {AudioNode} the hipass filter
 * @example
 * conn(square(800), hipass(400))
 * @see filter
 */
const hipass = filter.bind(null, 'highpass');

/**
 * Create a bandpass filter. An alias for `filter('bandpass', ...)`
 *
 * @function
 * @param {Number|AudioNode} frequency - the frequency in hertzs (can be a number or a signal)
 * @param {Object} options - (Optional) the same options as `filter` function
 * @return {AudioNode} the bandpass filter
 * @example
 * conn(square(800), bandpass(400))
 * @see filter
 */
const bandpass = filter.bind(null, 'hipass');

/* global XMLHttpRequest */
var NONE = {};
/**
 * This module contains some functions to fetch and decode audio files.
 *
 * @module load
 */

/**
 * Load a remote audio file and return a promise.
 * @param {String} url
 * @param {Object} options - (Optional) may include:
 *
 * - context: the audio context
 *
 * @return {Promise<AudioBuffer>} a promise that resolves to an AudioBuffer
 * @example
 * load('sound.mp3').then(function (buffer) {
 *   sample(buffer, true).start()
 * }
 */
function load (url, opts) {
  opts = opts || NONE;
  return fetch(url, 'arraybuffer').then(decodeAudio(context(opts.context)))
}

/**
 * Fetch an url and return a promise
 * @param {String} url - the url
 * @param {String} type - can be 'text' or 'arraybuffer'
 * @return {Promise} a promise to the result
 */
function fetch (url, type) {
  type = type === 'arraybuffer' ? type : 'text';
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = type;

    xhr.onload = function () {
      if (xhr.response) {
        resolve(xhr.response);
      }
    };
    xhr.onerror = reject;

    xhr.send();
  })
}

/**
 * Decode an array buffer into an AudioBuffer.
 * @param {AudioContext} context - (Optional) the context to be used (can be null to use
 * synth-kit's default audio context)
 * @param {Array} array - (Optional) the array to be decoded. If not given,
 * it returns a function that decodes the buffer so it can be chained with
 * fetch function (see example)
 * @return {Promise<AudioBuffer>} a promise that resolves to an audio buffer
 * @example
 * fecth('sound.mp3').then(decodeAudio())
 */
function decodeAudio (ac, arrayBuffer) {
  if (arguments.length === 1) return function (array) { return decodeAudio(ac, array) }
  return new Promise(function (resolve, reject) {
    ac.decodeAudioData(arrayBuffer, resolve, reject);
  })
}

/**
 * In synth-kit buffers can be generated (with the `gen` function) or
 * retrieved from an audio file (with the `sample`) function
 *
 * @module buffers
 */
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
function source (buffer, o) {
  o = o || OPTS;
  var src = context(o.context).createBufferSource();
  src.buffer = isA('function', buffer) ? buffer() : buffer;
  if (!src.buffer) console.warn('Buffer not ready.');
  if (o.loop) src.loop = true;
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
function sample (url, opts) {
  var bf = null;
  function buffer () { return bf }
  var promise = load(url, opts).then(function (buffer) {
    buffer.url = url;
    bf = buffer;
    return bf
  });
  buffer.then = promise.then.bind(promise);
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
function gen (generators, samples, o) {
  samples = samples || 2;
  o = o || OPTS;
  return function () {
    if (!Array.isArray(generators)) generators = [ generators ];
    var reverse = o.reverse;
    var numOfChannels = generators.length;
    var ctx = context(o.context);

    var buffer = ctx.createBuffer(numOfChannels, samples, samplingRate(ctx));
    for (var ch = 0; ch < numOfChannels; ch++) {
      generateData(generators[ch], buffer.getChannelData(ch), samples, reverse);
    }
    return buffer
  }
}

function generateData (generator, data, samples, reverse) {
  for (var i = 0; i < samples; i++) {
    data[i] = generator(reverse ? samples - i : i);
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
function white (samples, options) {
  if (!isA('number', samples)) samples = samplingRate(options);
  return source(gen(white.generator, samples, options), options)
}
white.generator = function () { return Math.random() * 2 - 1 };

/**
 *
 * @module envelopes
 */
function eachStage (stages, fn) { stages.forEach(function (s) { fn.apply(null, s); }); }

/**
 * Create an attack-decay envelope with fixed duration. It's composed by a
 * linear attack ramp and an exponential decay. This envelope doesn't
 * have release, so it stops after the duration (attack + decay).
 *
 * @param {Number} attack - (Optional) the attack time, defaults to 0.01
 * @param {Number} decay - (Optional) the decay time, defaults to 0.2
 * @param {Object} options - (Optional) an options with a context
 * @return {AudioNode} the signal envelope
 * @example
 * conn(sine(1000), perc(0.01, 0.5))
 * conn(sine(1000), perc(null, 1)) // default attack
 * conn(sine(1000), perc()) // default values
 */
function perc (attack, decay, opts) {
  if (isA('object', attack)) return perc(attack.attack, attack.decay, attack)
  var a = [ [0, 0, 'set'], [attack || 0.01, 1, 'lin'], [decay || 0.2, 0, 'exp'] ];
  return envelope(a, null, opts)
}

var ADSR = [0.01, 0.1, 0.8, 0.3];
/**
 * Create an adsr envelope
 * @params {Object} options - (Optional) the options may include:
 *
 * - adsr: an array with the form [attack, decay, sustain, release]
 * - attack: the attack time (will override the a in the adsr param)
 * - decay: the decay time (will override the d in adsr param)
 * - sustain: the sustain gain value (will override the s in the adsr param)
 * - release: the release time (will override the r in the adsr param)
 */
function adsr (o) {
  o = o || OPTS;
  var adsr = o.adsr || ADSR;
  if (!isA('number', o.attack)) o.attack = adsr[0];
  if (!isA('number', o.decay)) o.decay = adsr[1];
  if (!isA('number', o.sustain)) o.sustain = adsr[2];
  if (!isA('number', o.release)) o.release = adsr[3];
  var a = [ [0, 0, 'set'], [o.attack, 1, 'lin'], [o.decay, o.sustain, 'exp'] ];
  var r = [ [0, o.sustain, 'set'], [o.release, 0, 'exp'] ];
  return envelope(a, r, o)
}

/**
 * A frequency envelope. Basically the setup to provide an adsr over a
 * number of octaves.
 * @param {Number} frequency - the initial frequency
 * @param {Number} octaves - (Optional) the number of octaves of the envelope (1 by default)
 * @param {Object} options - the same options as an ADSR envelope
 * @see adsr
 * @example
 * conn(saw(1200), lowpass(freqEnv(440, 2, { release: 1 })))
 */


/**
 * Create a gain envelope
 * @param {Array<Stage>} attStages - the attack part of the envelope
 * @param {Array<Stage>} relStages - the release part of the envelope
 * @private
 */
function envelope (attEnvelope, relEnvelope, opts) {
  var g = gain(0, opts);
  g.start = apply(g.gain, attEnvelope);
  if (!relEnvelope) {
    g.duration = duration(attEnvelope);
    g.stop = function () {};
  } else {
    g.stop = apply(g.gain, relEnvelope);
    g.release = duration(relEnvelope);
  }
  return g
}

/**
 * Apply a contour to a parameter
 * @param {AudioParam} param - the parameter to apply the contour to
 * @param {Array<Stage>} contour - a list of countour stages, each of which
 * is composed of [time, value, type].
 * @example
 * apply(filter.frequency, [ [0, 440, 'set'], [5, 880, 'lin'] ])
 * @private
 */
function apply (param, contour) {
  return function (t) {
    t = when(t, 0, param.context);
    eachStage(contour, function (time, value, type) {
      t += time;
      if (type === 'set') param.setValueAtTime(value, t);
      else if (type === 'lin') param.linearRampToValueAtTime(value, t);
      else if (type === 'exp') param.exponentialRampToValueAtTime(value !== 0 ? value : 0.00001, t);
      else console.warn('Invalid stage type', time, value, type);
    });
  }
}

/**
 * Calculate the duration of a contour
 * @private
 */
function duration (contour) {
  return contour.reduce(function (dur, stage) {
    return dur + stage[0]
  }, 0)
}

/** @module effects */
/**
 * Mix an effect with the signal. Can be partially applied to create an
 * effect bus.
 * @param {Number} wet - the amount of effect (0-1)
 * @param {AudioNode} fx - the effect unit
 * @param {Object} options - (Optional) may include:
 *
 * - compensate: it it's false, the dry signal gain will pass without reduction.
 * If true (it's true by default) the dry signal is reduced the gain of the wet signal.
 * - context: the audio context
 *
 * @return {AudioNode}
 * @example
 * mix(dB(-3), delay(ms(800)))
 * @example
 * // create an effect bus
 * var rev = mix(reverb(2))
 * conn(sine(300), rev(0.2))
 */
function mix (wet, fx, opts) {
  if (arguments.length === 1) return function (w, o) { return mix(w, wet, o) }
  if (!isA('number', wet)) wet = 0.5;
  opts = opts || OPTS;
  var dry = opts.compensate === false ? 1 : 1 - wet;
  console.log('MIX', wet, dry, opts);
  return add(gain(dry), conn(fx, gain(wet)))
}

/**
 * Create a feedback loop.
 * @param {Integer} amount - the amount of signal
 * @param {AudioNode} node - the node to feedback
 * @param {Object} options - (Optional) options may include:
 *
 * - context: the audio context to use
 *
 * @return {AudioNode} the original node (with a feedback loop)
 */
function feedback (amount, node, options) {
  var feed = gain(amount, options);
  node.conn(feed);
  feed.conn(node);
  return node
}

/**
 * Create a tremolo
 */
function tremolo (rate, type, ac) {
  type = type || 'sine';
  return gain(osc(type, rate, ac), ac)
}

/**
 * Create a delay (a DelayNode object)
 */
function dly (time, opts) {
  opts = opts || OPTS;
  var dly = context(opts.context).createDelay(5);
  return lifecycle(dly, [
    plug('delayTime', time, dly)
  ])
}

/**
 * Create a convolver
 * @param {AudioBuffer} buffer
 * @param {Object} options - (Optional) options may include:
 *
 * - normalize: true to normalize the buffer
 * - context: the audio context to use
 *
 * @return {AudioNode} the convolver (ConvolverNode)
 * @example
 * reverb = mix(convolve(sample('emt-140.wav')))
 * connect(subtractive(880, { perc: [0.1, 1] }), reverb(0.2))
 */
function convolve (buffer, o) {
  o = o || OPTS;
  var c = context(o.context).createConvolver();
  c.buffer = isA('function', buffer) ? buffer() : buffer;
  if (o.normalize === true) c.normalize = true;
  return c
}

/**
 * Create a reverb impulse response using a logarithmic decay white noise
 * @param {Number} duration - the duration in samples
 * @param {Object} options - (Optional) options may include:
 *
 * - decay: the decay length in samples
 * - attack: the attack time in samples
 * - reverse: get the reversed impulse
 * - context: the context to use
 *
 * @return {AudioBuffer} the impulse response audio buffer
 */
function decayIR (samples, opts) {
  samples = samples || 10000;
  opts = opts || OPTS;
  var attack = opts.attack || Math.floor(samples / 10);
  var decay = opts.decay || samples - attack;
  // 60dB is a factor of 1 million in power, or 1000 in amplitude.
  var base = Math.pow(1 / 1000, 1 / decay);
  return gen(function (i) {
    var dec = base ? Math.pow(base, i) : 1;
    var att = i < attack ? (i / attack) : 1;
    return att * white.generator(i) * dec
  }, samples, opts)
}

/**
 * Create a simple reverb
 * @param {Number} duration - in seconds? WTF?
 */
function reverb (duration, opts) {
  opts = opts || OPTS;
  var rate = samplingRate(opts.context);
  return convolve(decayIR(duration * rate, opts), opts)
}

/**
 * A mono or stereo delay with filtered feedback
 */
function delay (time, filter$$1, feedAmount, ac) {
  if (!isA('number', feedAmount)) feedAmount = 0.3;
  filter$$1 = isA('number', filter$$1) ? lowpass(filter$$1, null, null, ac) : filter$$1 || bypass(ac);
  return feedback(feedAmount, dly(time, ac), filter$$1, ac)
}

/**
 * This module provides some typical syntetizers components, like vca, vcf
 * and some syntetizers
 * @example
 * // a dual osc synth sound
 * synth(
 *  frequency: 440,
 *  oscillators: { ratios: [1, 5/7, 9/8], types: 'saw' },
 *  attack: 0.1, release: 0.1,
 *  filter: { frequency: 'follow' }
  ).connect(dest()).start()
 * @module synths
 */
/**
 * Decorate a function to have default configuration
 */
function withDefaults (synth, defaults) {
  return function (options) {
    return synth(assign({}, defaults, options))
  }
}

/**
 * Create a VCA: an amplifier controlled by an ADSR envelope
 * @param {Object} options - may include:
 *
 * - db: the gain in decibels
 * - gain: the gain (will override dB param)
 * - attack, decay, sustain, release: the ADSR envelope parameters
 * - context: the audio context
 */
const vca = withDefaults(function (opts) {
  if (!isA('number', opts.gain)) opts.gain = dBToGain(opts.dB) || 1;
  return conn(gain(opts), adsr(opts))
}, {
  dB: 0, // in dB
  attack: 0.01, // attack time in seconds
  decay: 0.1, // decay time in seconds
  sustain: 0,
  release: 0.1
});

/**
 * Create a VCF: a filter controlled by an ADSR envelope
 * @param {Object} config - may include:
 *
 * - type: filter type
 * - frequency: filter frequency (can be a signal)
 * - octaves: amplitude of the modulation in octaves (defaults to 2)
 * - attack, decay, sustain, release: the adsr parameters
 * - context: the audio context

 * @example
 * conn(square({ frequency: 800 }), vcf({ frequency: 400, attack: 0.1 }))
 */
const vcf = withDefaults(function (opts) {
  var mod = conn(signal(mult(opts.octaves, opts.frequency)), adsr(opts));
  return filter(opts.type, add(signal(opts.frequency), mod), opts)
}, {
  type: 'lowpass',
  frequency: 22000,
  octaves: 2,
  attack: 0.01,
  decay: 0.1,
  sustain: 0,
  release: 0.1
});

/**
 * A subtractive synthetizer (oscillator bank -> VCF -> VCA)
 *
 * @param {AudioNode|Number|String} source - The subtractive synth source
 * @param {Object} options - (Optional) the configuration may include:
 *
 * - gain: the gain (defaults to 1)
 * - adsr: the parameters of the gain envelop in the form [attack, decay, sustain, release]
 * - attack, decay, sustain, release: the parameters of the gain envelope. It
 * will override the one provided by adsr parameter if any
 * - filter: an object with the filter properties
 * - filter.type: the filter type ('lowpass' by default)
 * - filter.frequency: the filter frequency (can be follow to use the options.frequency value)
 * - filter.adsr: the filter envelope
 * - filter.attack, filter.decay, filter.sustain, filter.release: the individual
 * filter envelope parameters
 * - filter.octaves: the number of the octaves of the filter envelope (1 by default)
 *
 * @function
 * @example
 * // a 300Hz sawtooth with adsr and lowass filter at 600
 * subtractive({ frequency: 300, type: 'sawtooth', adsr: [0.01, 0.1, 0.8, 1], filter: { type: 'lowpass', frequency: 600 } })
 * // a custom source node
 * substractive({ source: add(white(), square(500)), attack: 0.1, duration: 1 })
 * // connected in a chain
 * connect(sample('snare.wav', subtractive({ attack: 0.1 }))
 */
function subtractive (opts) {
  opts = opts || OPTS;
  return conn(bank(opts), vcf(opts.filter), vca(opts))
}

/**
 * Create a bank of oscillators.
 *
 * @param {Array<Float>} frequencies - an array with the frequencies
 * @param {Object} options - (Optional) options can include:
 *
 * - frequencies: an array with the frequencies of the oscillators (will
 * override ratios)
 * - ratios: an array of relative freqnecies of the oscillators (in combination
 * iwth frequency paramter)
 * - frequency: the base frequency of the oscillators (only used if frequencies)
 * - types: a value or an array of oscillator types. If the array is shorter
 * than the frequencies array, it's assumed to be circular.
 * - gains: a value or an array of gain values. If the array is shorter
 * than the frequencies array, it's assumed to be circular.
 * - compensate: if true, the gain of the bank will be reduced by the number
 * of oscillators (true by default)
 *
 * @return {AudioNode}
 *
 * @example
 * // create three sines with unrelated frequencies:
 * bank({ frequencies: [1345.387, 435.392, 899.432] })
 * // create three sawtooth with relative frequencies:
 * bank({ frequency: 440, ratios: [1, 2, 2.4] , types: 'sawtooth' })
 * // create two squares of 400 and 800 and two sawtooths of 600 and 1200
 * // (the types are cyclic)
 * bank({ frequencies: [400, 600, 800, 1200], types: ['square', 'sawtooth'] })
 * // specify gains
 * bank({ frequencies: [440, 660], gains: [0.6, 0.2] })
 */
function bank (opts) {
  opts = opts || OPTS;
  var base = opts.ratios ? opts.frequency || 440 : 1;
  var freqs = toArr(opts.frequencies || opts.ratios || 440);
  var gains = toArr(opts.gains || 1);
  var types = toArr(opts.types || 'sine');
  var N = opts.compensate === false ? 1 : freqs.length;

  var tl = types.length;
  var gl = gains.length;
  return conn(add(freqs.map(function (freq, i) {
    var src = osc(types[i % tl], base * freq);
    var g = gains[i % gl];
    return g === 1 ? src : conn(src, gain(g))
  })), gain(1 / N))
}

/**
 * Decorate a synth to use a destination. A synth is any function that
 * returns an audio node
 * @param {Function} synth - the audio node builder
 * @param {AudioNode} destination - (Optional) destination (or the default destination)
 * @return {Function} the decorated synth function
 * @example
 * // TODO: write a more realistic example
 * var synth = withDest(sine, dest())
 * synth(300).start()
 * // TODO: make this function public
 * @private
 */
function withDest (synth, dest) {
  return function (value) {
    var node = synth ? synth(value) : value;
    if (dest) node.connect(dest);
    return node
  }
}

/**
 * Instruments provide a OOP style interface to the synths. Something with
 * `start` and `stop` methods, than can be called several times and know about
 * note frequencies and midi connections.
 *
 * @example
 * var simple = inst((fq) => conn(sine(fq), adsr()))
 * simple.start('C4')
 * simple.start('G5')
 * simple.stop() // => stop all notes
 * @module instruments
 */
/**
 * A master output instrument. You can use it to start and stop nodes. All
 * started nodes will be connected to the AudioContext destination.
 *
 * @example
 * master.start(sine(300)) // connect to destination and start
 * master.start(sine(600), 0, 1) // connect to destination and start after 1 second
 * master.stop() // stop all
 */
var master = inst(null, dest());

/**
 * Create an object-oriented-style instrument player. It wraps a synth function
 * (a function that create nodes) into in a convenient player API. It can
 * be used to limit the polyphony.
 *
 * The player object have the following methods:
 *
 * - `start(node, when, delay, duration)`: start a node
 * - `stop`: stop all nodes
 * - `on(name, callback)`: add an event callback
 * - `event(name, ...values)`: fire an event
 *
 *
 * @param {Function} synth - the synth function (a function that returns a node graph)
 * @param {AudioNode} destination - if present, all nodes will be connected to
 * this destination
 * @param {Object} options - (Optional) the options may include:
 *
 * - maxVoices: the maximum number of simultaneous voices. No value (by default)
 * means no limit.
 *
 * @return {Player} a player object
 *
 * @example
 * // an instrument with destination
 * var synth = inst((fq) => sine(fq), dest())
 * synth.start('A4')
 * synth.stopAll()
 * @example
 * // only the destination
 * var master = inst(null, conn(mix(0.2), reverb(), dest()))
 * master.start(sine(300))
 * master.start(sine(400))
 * master.stopAll()
 */
function inst (synth, destination, options) {
  synth = withDest(synth, destination || dest());
  return tracker(synth, options || OPTS)
}

/**
 * tracker: (fn: (object) => Node, options: object) => interface { start: fn, stop: fn }
 * @private
 */
function tracker (synth, opts) {
  var ob = observable({});
  var limit = opts ? opts.maxVoices : 0;
  var voices = { limit: limit, all: {}, nextId: 0, current: 0, pool: new Array(limit) };

  function track (node) {
    node.id = voices.nextId++;
    voices.all[node.id] = node;
    on(node, 'ended', function () {
      delete voices.all[node.id];
      ob.event('voices', Object.keys(voices.all), limit);
    });
    return node
  }

  ob.start = function (value, time, delay, duration) {
    var node = synth(value);
    if (node.start) {
      track(node);
      time = start(node, time, delay, duration).startedAt;
      ob.event('start', node.id, time);
      ob.event('voices', Object.keys(voices.all), limit);
    }
    return node
  };
  ob.stop = function (ids, time, delay) {
    var t = 0;
    ids = toArr(ids || ids === 0 ? ids : Object.keys(voices.all));
    ids.forEach(function (id) {
      if (voices.all[id]) {
        if (!t) t = when(time, delay, voices.all[id].context);
        voices.all[id].stop(t);
      }
    });
  };
  return ob
}

function start (node, time, delay, duration) {
  if (time && !isA('number', time)) throw Error('Invalid time (maybe forgot connect?): ', time, delay, duration, node)
  time = when(time, delay, context(node.context));
  node.start(time);
  node.startedAt = time;
  var d = duration || node.duration;
  if (d) node.stop(time + d);
  return node
}

// EVENTS
// ======
// decorate an objet to have `on` and `event` methods
function observable (obj) {
  obj.on = on.bind(null, obj);
  obj.event = event.bind(null, obj);
  return obj
}

// add a listener to a target
function on (target, name, callback) {
  if (!name || name === '*') name = 'event';
  var prev = target['on' + name];
  target['on' + name] = function () {
    if (prev) prev.apply(null, arguments);
    callback.apply(null, arguments);
  };
  return target
}

// fire an event
function event (target, name /*, ...values */) {
  var args = slice.call(arguments, 1);
  if (isA('function', target['on' + name])) target['on' + name].apply(null, args);
  if (isA('function', target.onevent)) target.onevent.apply(null, args);
  return target
}

exports.context = context;
exports.now = now;
exports.dest = dest;
exports.samplingRate = samplingRate;
exports.timeToSamples = timeToSamples;
exports.tempo = tempo;
exports.note = note;
exports.hz = hz;
exports.dBToGain = dBToGain;
exports.gainToDb = gainToDb;
exports.conn = conn;
exports.add = add;
exports.constant = constant;
exports.bypass = bypass;
exports.gain = gain;
exports.signal = signal;
exports.mult = mult;
exports.scale = scale;
exports.osc = osc;
exports.sine = sine;
exports.saw = saw;
exports.square = square;
exports.triangle = triangle;
exports.lfo = lfo;
exports.filter = filter;
exports.lowpass = lowpass;
exports.hipass = hipass;
exports.bandpass = bandpass;
exports.sample = sample;
exports.gen = gen;
exports.source = source;
exports.white = white;
exports.load = load;
exports.decodeAudio = decodeAudio;
exports.fetch = fetch;
exports.perc = perc;
exports.adsr = adsr;
exports.mix = mix;
exports.feedback = feedback;
exports.tremolo = tremolo;
exports.dly = dly;
exports.delay = delay;
exports.convolve = convolve;
exports.decayIR = decayIR;
exports.reverb = reverb;
exports.withDefaults = withDefaults;
exports.vca = vca;
exports.vcf = vcf;
exports.subtractive = subtractive;
exports.bank = bank;
exports.inst = inst;
exports.master = master;

Object.defineProperty(exports, '__esModule', { value: true });

})));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
// https://teichman.org/blog/2011/05/roto.html
// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
// http://www.dairiki.org/HammondWiki/OriginalHammondLeslieFaq
// http://www.stefanv.com/electronics/hammond_drawbar_science.html
var _ = require('..')

// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
var RATIOS = [0.5, 1.498823530, 1, 2, 2.997647060, 4, 5.040941178, 5.995294120, 8]

/**
 * Create a poor man's hammond-like sound
 */
function b3 (preset, frequency) {
  if (typeof preset === 'string') preset = b3.presets[preset] || b3.parse(preset)
  else if (!Array.isArray(preset)) throw Error('Not valid B3 registration', preset)
  var osc = drawbars(preset)
  return frequency ? osc(frequency) : osc
}

b3.parse = function (str) {
  return (str.replace(/[^12345678]/g, '') + '00000000').slice(0, 9).split('').map(Math.abs)
}

// http://www.dairiki.org/HammondWiki/PopularDrawbarRegistrations
b3.presets = {
  gospel: b3.parse('88 8000 008'),
  blues: b3.parse('88 8800 000'),
  bluesB: b3.parse('88 5324 588'),
  booker: b3.parse('88 8630 000'),
  onions: b3.parse('80 8800 008'),
  smith: b3.parse('88 8000 000'),
  mcgriff: b3.parse('86 8600 006'),
  errol: b3.parse('80 0008 888'),
  genesis: b3.parse('33 6866 330')
}

function drawbars (preset) {
  var gains = null // lazy
  return function (frequency) {
    gains = gains || preset.map(function (n) {
      return _.dB(-3 * (8 - n))
    })
    return _.oscBank(frequency, RATIOS, ['sine'], gains)
  }
}

module.exports = b3

},{"..":1}],3:[function(require,module,exports){
// Basic syntetizers
var Kit = require('..')

function ping (fq, opts) {
  opts = opts || {}
  fq = fq || 1000
  return Kit.conn(Kit.osc(opts.type, fq), Kit.perc(opts))
}

module.exports = { ping: ping }

},{"..":1}],4:[function(require,module,exports){
var Kit = require('..')
var URL = 'https://danigb.github.io/sampled/IR/EMT140-Plate/samples/'

function emt140 (name) {
  var c = Kit.convolve(null)
  var promise = emt140.fetch(name).then(function (buffer) {
    c.buffer = buffer
    console.log('Reverb ready', name, buffer)
    return c
  })
  c.then = promise.then.bind(promise)
  return c
}

emt140.fetch = function (name) {
  name = name || 'Emt 140 Medium 2'
  name = name.toLowerCase().replace(/\s+/g, '_') + '.wav'
  return Kit.sample(URL + name)
}

emt140.NAMES = [ 'Emt 140 Bright 1', 'Emt 140 Bright 2', 'Emt 140 Bright 3',
'Emt 140 Bright 4', 'Emt 140 Dark 1', 'Emt 140 Bright 5', 'Emt 140 Dark 2',
'Emt 140 Dark 3', 'Emt 140 Dark 4', 'Emt 140 Dark 5', 'Emt 140 Medium 1',
'Emt 140 Medium 3', 'Emt 140 Medium 2', 'Emt 140 Medium 4', 'Emt 140 Medium 5' ]

module.exports = emt140

},{"..":1}],5:[function(require,module,exports){
module.exports={
  "Piano": [
    "Acoustic Grand Piano",
    "Bright Acoustic Piano",
    "Electric Grand Piano",
    "Electric Piano 1",
    "Electric Piano 2",
    "Clavichord",
    "Harpsichord",
    "Honkytonk Piano"
  ],
  "Organ": [
    "Church Organ",
    "Drawbar Organ",
    "Reed Organ",
    "Rock Organ",
    "Percussive Organ"
  ],
  "Guitar": [
    "Acoustic Guitar Nylon",
    "Acoustic Guitar Steel",
    "Electric Guitar Clean",
    "Electric Guitar Jazz",
    "Electric Guitar Muted",
    "Distortion Guitar",
    "Guitar Fret Noise",
    "Guitar Harmonics",
    "Overdriven Guitar"
  ],
  "Bass": [
    "Acoustic Bass",
    "Electric Bass Finger",
    "Electric Bass Pick",
    "Contrabass",
    "Fretless Bass",
    "Synth Bass 1",
    "Synth Bass 2",
    "Slap Bass 1",
    "Slap Bass 2"
  ],
  "Strings": [
    "Cello",
    "Viola",
    "Violin",
    "Tremolo Strings",
    "Pizzicato Strings",
    "Synthstrings 1",
    "Synthstrings 2"
  ],
  "Reed": [
    "Soprano Sax",
    "Alto Sax",
    "Tenor Sax",
    "Baritone Sax",
    "Bassoon",
    "Clarinet",
    "Oboe"
  ],
  "Brass": [
    "Brass Section",
    "English Horn",
    "French Horn",
    "Muted Trumpet",
    "Trombone",
    "Trumpet",
    "Tuba",
    "Synthbrass 1",
    "Synthbrass 2"
  ],
  "Ensemble": [
    "Choir Aahs",
    "Orchestra Hit",
    "Orchestral Harp",
    "String Ensemble 1",
    "String Ensemble 2"
  ],
  "Pipe": [
    "Flute",
    "Ocarina",
    "Pan Flute",
    "Piccolo",
    "Recorder",
    "Whistle"
  ],
  "World": [
    "Accordion",
    "Tango Accordion",
    "Bag Pipe",
    "Banjo",
    "Fiddle",
    "Harmonica",
    "Kalimba",
    "Koto",
    "Shakuhachi",
    "Shamisen",
    "Shanai",
    "Sitar"
  ],
  "Chromatic Percussion": [
    "Celesta",
    "Dulcimer",
    "Glockenspiel",
    "Marimba",
    "Music Box",
    "Xylophone",
    "Tubular Bells",
    "Vibraphone",
    "Steel Drums",
    "Tinkle Bell"
  ],
  "Percussion": [
    "Agogo",
    "Melodic Tom",
    "Woodblock",
    "Reverse Cymbal",
    "Timpani",
    "Synth Drum",
    "Taiko Drum"
  ],
  "Synth Lead": [
    "Lead 1 Square",
    "Lead 2 Sawtooth",
    "Lead 3 Calliope",
    "Lead 4 Chiff",
    "Lead 5 Charang",
    "Lead 6 Voice",
    "Lead 7 Fifths",
    "Lead 8 Bass Lead"
  ],
  "Synth Pad": [
    "Pad 1 New Age",
    "Pad 2 Warm",
    "Pad 3 Polysynth",
    "Pad 4 Choir",
    "Pad 5 Bowed",
    "Pad 6 Metallic",
    "Pad 7 Halo",
    "Pad 8 Sweep"
  ],
  "Sound Effects": [
    "Applause",
    "Bird Tweet",
    "Blown Bottle",
    "Breath Noise",
    "Gunshot",
    "Fx 1 Rain",
    "Fx 2 Soundtrack",
    "Fx 3 Crystal",
    "Fx 4 Atmosphere",
    "Fx 5 Brightness",
    "Fx 6 Goblins",
    "Fx 7 Echoes",
    "Fx 8 Scifi",
    "Helicopter",
    "Seashore",
    "Synth Voice",
    "Telephone Ring",
    "Voice Oohs"
  ]
}

},{}],6:[function(require,module,exports){
var _ = require('..')
var Note = require('note-parser')
function is (t, x) { return typeof x === t }

var GLEITZ = 'https://gleitz.github.io/midi-js-soundfonts/'
function isSoundfontURL (name) { return /\.js(\?.*)?$/i.test(name) }
/**
 * Get the url of a soundfont name
 */
function url (name, sf, format) {
  if (isSoundfontURL(name)) return name
  format = format === 'ogg' ? '-ogg' : '-mp3'
  sf = sf === 'FluidR3_GM' ? 'FluidR3_GM/' : 'MusyngKite/'
  return GLEITZ + sf + name.toLowerCase().replace(/\s+/g, '_') + format + '.js'
}

var LOAD_DEFAULTS = {
  format: 'mp3', soundfont: 'MusyngKite',
  fetch: _.fetch, decodeAudio: _.decodeAudio
}

/**
 * Load a MIDI.js prerendered soundfont file.
 * load('Acoustic Grand Piano').then(function (buffers) {
 *  buffer[60] // => <AudioBuffer> for midi note 60 ('C4')
})
 */
function load (name, options) {
  var o = Object.assign({}, options, LOAD_DEFAULTS)
  var promise = is('function', name.then) ? name
    : o.fetch(url(name, o.soundfont, o.format), 'text')
  return promise.then(decodeSoundfont(o.context, o.decodeAudio))
}

var INST_DEFAULTS = {
  gain: 1, filter: { type: 'lowpass', frequency: '22000' },
  attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.4
}

/**
 * Create a soundfont instrument.
 * The configuration object can contain the following options:
 * @param {String} name - the soundfont name
 * @param {Object} options - (Optional) soundfont options
 * @return {Instrument} the soundfont instrument
 * @example
 * var piano = Soundfont.instrument('Acoustic Grand Piano', { gain: 1.5 })
 * piano.on('ready', function () {
 *    piano.start('C4')
 * })
 */
function instrument (name, config) {
  var buffers = null
  var sample = function (midi) {
    if (buffers) return buffers[midi]
    console.warn('Instrument "' + name + '" not loaded yet.')
    return _.gen(function () { return 0 }, 2)
  }
  var synth = function (o) {
    console.log('sf synth', o)
    return _.connect(
      _.source(sample(o.midi), o),
      _.filter(o.filter.type, o.filter.frequency, o.filter),
      /* adsr(o), */
      _.gain(o)
    )
  }

  synth = _.withOptions(synth, {
    defaults: Object.assign({}, INST_DEFAULTS, config),
    toOptions: toOptions,
    prepare: prepareOptions
  })
  var sf = _.inst(synth, _.dest())
  load(name, config).then(function (result) {
    buffers = result
    sf.event('ready', sf, name)
  })
  return sf
}

function toOptions (note, context) {
  return is('number', note) ? { midi: note, context: context }
    : { note: note, context: context }
}

function prepareOptions (o) {
  var note = Note.parse(o.name || o.note)
  if (!o.note && note) o.note = Note.build(note)
  if (!o.midi && note) o.midi = note.midi
  if (!o.frequency && o.midi) o.frequency = Math.pow(2, (o.midi - 69) / 12) * 440
  if (!o.detune) {
    o.detune = Math.floor((o.midi % 1) * 100)
    if (o.detune) o.midi = Math.floor(o.midi)
  }
  return o
}

/**
 * Decode a soundfont text into a map of midi notes to audio buffers.
 * Can be partially applied.
 *
 * @param {AudioContext} - the audio context (or null to use the default context)
 * @param {String} content - the midi.js encoded soundfont text
 */
function decodeSoundfont (ac, decodeAudio) {
  var ctx = _.context(ac)
  return function (content) {
    var sf = parseMidijs(content)
    var names = Object.keys(sf)
    var promises = names.map(function (name) {
      return Promise.resolve(sf[name]).then(decodeBase64Audio).then(decodeAudio(ctx))
    })
    return Promise.all(promises).then(function (bufferList) {
      return names.reduce(function (buffers, name, i) {
        buffers[Note.midi(name)] = bufferList[i]
        return buffers
      }, {})
    })
  }
}

function parseMidijs (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  if (begin < 0) throw Error('Invalid MIDI.js Soundfont format')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

function decodeBase64Audio (source) {
  var i = source.indexOf(',')
  return base64Decode(source.slice(i + 1)).buffer
}

// DECODE UTILITIES
function b64ToUint6 (nChr) {
  return nChr > 64 && nChr < 91 ? nChr - 65
    : nChr > 96 && nChr < 123 ? nChr - 71
    : nChr > 47 && nChr < 58 ? nChr + 4
    : nChr === 43 ? 62
    : nChr === 47 ? 63
    : 0
}

// Decode Base64 to Uint8Array
// ---------------------------
function base64Decode (sBase64, nBlocksSize) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, '')
  var nInLen = sB64Enc.length
  var nOutLen = nBlocksSize
    ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
    : nInLen * 3 + 1 >> 2
  var taBytes = new Uint8Array(nOutLen)

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255
      }
      nUint24 = 0
    }
  }
  return taBytes
}

module.exports = { url: url, load: load, instrument: instrument }

},{"..":1,"note-parser":9}],7:[function(require,module,exports){
var _ = require('..')

function snare () {
  return _.connect(_.white(), _.perc())
}

module.exports = {
  snare: snare
}

},{"..":1}],8:[function(require,module,exports){
var SynthKit = require('.')
window.log = function (name) {
  return console.log.bind(console, name)
}
SynthKit.start = SynthKit.master.start
SynthKit.stop = SynthKit.master.stop

var basic = require('./instruments/basic')
SynthKit.ping = basic.ping

SynthKit.b3 = require('./instruments/b3')
SynthKit.sf = require('./instruments/soundfont').instrument
SynthKit.tr808 = require('./instruments/tr808')
SynthKit.emt140 = require('./instruments/emt140')
var sfnames = require('./instruments/sf-names.json')

SynthKit.sf.names = function (group, num) {
  return !group ? Object.keys(sfnames)
    : num ? sfnames[group][num - 1] : sfnames[group]
}
SynthKit.sf.search = function (str) {
  str = str.toLowerCase()
  var results = []
  Object.keys(sfnames).forEach(function (group) {
    sfnames[group].forEach(function (name) {
      if (name.toLowerCase().includes(str)) results.push(name)
    })
  })
  return results
}
SynthKit.live = function () {
  var names = []
  Object.keys(SynthKit).forEach(function (name) {
    window[name] = SynthKit[name]
    names.push(name)
  })
  window.inst = function (synth, dest, opts) {
    var i = SynthKit.inst(synth, dest, opts)
    i.on('ready', function (_, name) {
      console.log('Instrument ready: ', name)
    })
    return i
  }
  console.log('SynthKit live', 200, names.length)
  console.log(names.sort().join(', '))
}

module.exports = SynthKit

},{".":1,"./instruments/b3":2,"./instruments/basic":3,"./instruments/emt140":4,"./instruments/sf-names.json":5,"./instruments/soundfont":6,"./instruments/tr808":7}],9:[function(require,module,exports){
'use strict'

// util
function fillStr (s, num) { return Array(num + 1).join(s) }
function isNum (x) { return typeof x === 'number' }
function isStr (x) { return typeof x === 'string' }
function isDef (x) { return typeof x !== 'undefined' }
function midiToFreq (midi, tuning) {
  return Math.pow(2, (midi - 69) / 12) * (tuning || 440)
}

var REGEX = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/
/**
 * A regex for matching note strings in scientific notation.
 *
 * @name regex
 * @function
 * @return {RegExp} the regexp used to parse the note name
 *
 * The note string should have the form `letter[accidentals][octave][element]`
 * where:
 *
 * - letter: (Required) is a letter from A to G either upper or lower case
 * - accidentals: (Optional) can be one or more `b` (flats), `#` (sharps) or `x` (double sharps).
 * They can NOT be mixed.
 * - octave: (Optional) a positive or negative integer
 * - element: (Optional) additionally anything after the duration is considered to
 * be the element name (for example: 'C2 dorian')
 *
 * The executed regex contains (by array index):
 *
 * - 0: the complete string
 * - 1: the note letter
 * - 2: the optional accidentals
 * - 3: the optional octave
 * - 4: the rest of the string (trimmed)
 *
 * @example
 * var parser = require('note-parser')
 * parser.regex.exec('c#4')
 * // => ['c#4', 'c', '#', '4', '']
 * parser.regex.exec('c#4 major')
 * // => ['c#4major', 'c', '#', '4', 'major']
 * parser.regex().exec('CMaj7')
 * // => ['CMaj7', 'C', '', '', 'Maj7']
 */
function regex () { return REGEX }

var SEMITONES = [0, 2, 4, 5, 7, 9, 11]
/**
 * Parse a note name in scientific notation an return it's components,
 * and some numeric properties including midi number and frequency.
 *
 * @name parse
 * @function
 * @param {String} note - the note string to be parsed
 * @param {Boolean} isTonic - true the strings it's supposed to contain a note number
 * and some category (for example an scale: 'C# major'). It's false by default,
 * but when true, en extra tonicOf property is returned with the category ('major')
 * @param {Float} tunning - The frequency of A4 note to calculate frequencies.
 * By default it 440.
 * @return {Object} the parsed note name or null if not a valid note
 *
 * The parsed note name object will ALWAYS contains:
 * - letter: the uppercase letter of the note
 * - acc: the accidentals of the note (only sharps or flats)
 * - pc: the pitch class (letter + acc)
 * - step: s a numeric representation of the letter. It's an integer from 0 to 6
 * where 0 = C, 1 = D ... 6 = B
 * - alt: a numeric representation of the accidentals. 0 means no alteration,
 * positive numbers are for sharps and negative for flats
 * - chroma: a numeric representation of the pitch class. It's like midi for
 * pitch classes. 0 = C, 1 = C#, 2 = D ... 11 = B. Can be used to find enharmonics
 * since, for example, chroma of 'Cb' and 'B' are both 11
 *
 * If the note has octave, the parser object will contain:
 * - oct: the octave number (as integer)
 * - midi: the midi number
 * - freq: the frequency (using tuning parameter as base)
 *
 * If the parameter `isTonic` is set to true, the parsed object will contain:
 * - tonicOf: the rest of the string that follows note name (left and right trimmed)
 *
 * @example
 * var parse = require('note-parser').parse
 * parse('Cb4')
 * // => { letter: 'C', acc: 'b', pc: 'Cb', step: 0, alt: -1, chroma: -1,
 *         oct: 4, midi: 59, freq: 246.94165062806206 }
 * // if no octave, no midi, no freq
 * parse('fx')
 * // => { letter: 'F', acc: '##', pc: 'F##', step: 3, alt: 2, chroma: 7 })
 */
function parse (str, isTonic, tuning) {
  if (typeof str !== 'string') return null
  var m = REGEX.exec(str)
  if (!m || !isTonic && m[4]) return null

  var p = { letter: m[1].toUpperCase(), acc: m[2].replace(/x/g, '##') }
  p.pc = p.letter + p.acc
  p.step = (p.letter.charCodeAt(0) + 3) % 7
  p.alt = p.acc[0] === 'b' ? -p.acc.length : p.acc.length
  var pos = SEMITONES[p.step] + p.alt
  p.chroma = pos < 0 ? 12 + pos : pos % 12
  if (m[3]) { // has octave
    p.oct = +m[3]
    p.midi = pos + 12 * (p.oct + 1)
    p.freq = midiToFreq(p.midi, tuning)
  }
  if (isTonic) p.tonicOf = m[4]
  return p
}

var LETTERS = 'CDEFGAB'
function acc (n) { return !isNum(n) ? '' : n < 0 ? fillStr('b', -n) : fillStr('#', n) }
function oct (n) { return !isNum(n) ? '' : '' + n }

/**
 * Create a string from a parsed object or `step, alteration, octave` parameters
 * @param {Object} obj - the parsed data object
 * @return {String} a note string or null if not valid parameters
 * @since 1.2
 * @example
 * parser.build(parser.parse('cb2')) // => 'Cb2'
 *
 * @example
 * // it accepts (step, alteration, octave) parameters:
 * parser.build(3) // => 'F'
 * parser.build(3, -1) // => 'Fb'
 * parser.build(3, -1, 4) // => 'Fb4'
 */
function build (s, a, o) {
  if (s === null || typeof s === 'undefined') return null
  if (s.step) return build(s.step, s.alt, s.oct)
  if (s < 0 || s > 6) return null
  return LETTERS.charAt(s) + acc(a) + oct(o)
}

/**
 * Get midi of a note
 *
 * @name midi
 * @function
 * @param {String|Integer} note - the note name or midi number
 * @return {Integer} the midi number of the note or null if not a valid note
 * or the note does NOT contains octave
 * @example
 * var parser = require('note-parser')
 * parser.midi('A4') // => 69
 * parser.midi('A') // => null
 * @example
 * // midi numbers are bypassed (even as strings)
 * parser.midi(60) // => 60
 * parser.midi('60') // => 60
 */
function midi (note) {
  if ((isNum(note) || isStr(note)) && note >= 0 && note < 128) return +note
  var p = parse(note)
  return p && isDef(p.midi) ? p.midi : null
}

/**
 * Get freq of a note in hertzs (in a well tempered 440Hz A4)
 *
 * @name freq
 * @function
 * @param {String} note - the note name or note midi number
 * @param {String} tuning - (Optional) the A4 frequency (440 by default)
 * @return {Float} the freq of the number if hertzs or null if not valid note
 * @example
 * var parser = require('note-parser')
 * parser.freq('A4') // => 440
 * parser.freq('A') // => null
 * @example
 * // can change tuning (440 by default)
 * parser.freq('A4', 444) // => 444
 * parser.freq('A3', 444) // => 222
 * @example
 * // it accepts midi numbers (as numbers and as strings)
 * parser.freq(69) // => 440
 * parser.freq('69', 442) // => 442
 */
function freq (note, tuning) {
  var m = midi(note)
  return m === null ? null : midiToFreq(m, tuning)
}

var parser = { parse: parse, build: build, regex: regex, midi: midi, freq: freq }
// add additional functions, one for each object property
var FNS = ['letter', 'acc', 'pc', 'step', 'alt', 'chroma', 'oct']
FNS.forEach(function (name) {
  parser[name] = function (src) {
    var p = parse(src)
    return p && isDef(p[name]) ? p[name] : null
  }
})

module.exports = parser

},{}]},{},[8]);
