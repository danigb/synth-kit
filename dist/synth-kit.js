(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.SynthKit = global.SynthKit || {})));
}(this, function (exports) { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var __moduleExports = createCommonjsModule(function (module) {
	if (typeof window !== "undefined") {
	    module.exports = window;
	} else if (typeof commonjsGlobal !== "undefined") {
	    module.exports = commonjsGlobal;
	} else {
	    module.exports = {};
	}
	});

	var index = createCommonjsModule(function (module) {
	var window = __moduleExports;

	var Context = window.AudioContext || window.webkitAudioContext;
	if (Context) module.exports = new Context;
	});

	// Shim to make connect chainable (soon to be implemented native)
	var proto = Object.getPrototypeOf(Object.getPrototypeOf(index.createGain()))
	var _connect = proto.connect
	proto.connect = function () {
	  _connect.apply(this, arguments)
	  return this
	}

	/**
	 * Get the audio context
	 */
	function context (ctx) { return ctx || index }

	/**
	 * Get the audio context of an audio node
	 */
	function contextOf (node) { return node ? context(node.context) : index }

	/**
	 * Get the audio context's destination
	 */
	function dest (context) { return (context || index).destination }

	/**
	 * Get audio context's current time
	 */
	function now (context) { return (context || index).currentTime }

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
	function when (time, delay, ctx) {
	  return Math.max(now(ctx), time || 0) + (delay || 0)
	}

	/**
	 * Get time after n seconds (from now)
	 * @param {Float} delay - the delay
	 * @param {AudioContext} context - (Optional) the audio context
	 * @return {Float} time in seconds
	 * @example
	 * now() // => 0.785
	 * after(1) // => 1.785
	 */
	var after = when.bind(0)

	/**
	 * Get audio context sampling rate
	 * @param {AudioContext} context - (Optional) the audio context
	 * @return {Integer} the context's sampling rate
	 * @example
	 * samplingRate() // => 44100
	 */
	function samplingRate (context) { return (context || index).sampleRate }

	/**
	 * Convert from seconds to samples (using AudioContext sampling rate)
	 * @param {Float} seconds - the number of seconds
	 * @param {AudioContext} context - (Optional) the audio context
	 * @return {Integer} the number of samples
	 * @example
	 * white(seconds(1.2)) // => generate 1.2 seconds of white noise
	 */
	function seconds (secs, context) { return secs * samplingRate(context) }

	function isNum (n) { return typeof n === 'number' }
	function isFn (x) { return typeof x === 'function' }
	function isStr (x) { return typeof x === 'string' }
	function isObj (x) { return typeof x === 'object' }

	// CONVERSION
	// ==========

	/**
	 * Plug something (a value, a node) into a node parameter
	 */
	function plug (name, value, node) {
	  if (typeof value === 'undefined') {
	    // do nothing
	  } else if (typeof value.connect === 'function') {
	    node[name].value = 0
	    value.connect(node[name])
	    return value
	  } else if (node[name]) {
	    node[name].value = value
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
	  if (node[event]) node[event](value)
	  dependents.forEach(function (dep) {
	    if (dep && dep[event]) dep[event](value)
	  })
	  return node
	}

	/**
	 * Override node functions to handle better the node's lifecycle
	 */
	function lifecycle (node, dependents) {
	  // TODO: possible optimization: if dependents is empty, no need to decorate
	  var raw = bindLifecycle(node)

	  node.connected = false
	  node.disconnect = function () {
	    node.connected = false
	    dispatch('disconnect', null, raw, dependents)
	  }
	  node.start = function (when, delay, duration) {
	    var time = toTime(node.context, when, delay)
	    // if (!node.connected) node.connect(node.context.destination)
	    dispatch('start', time, raw, dependents)
	    if (duration) node.stop(time + duration)
	    return node
	  }
	  node.stop = function (when, delay) {
	    var time = toTime(node.context, when, delay)
	    dispatch('stop', time, raw, dependents)
	  }
	  return node
	}

	/**
	 * Convert from beats per minute to hertzs
	 * @param {Integer} bpm - the tempo
	 * @param {Integer} sub - (Optional) subdivision (default 1)
	 * @return {Float} the tempo expressed in hertzs
	 */
	function tempo (bpm, sub) { return (bpm / 60) * (sub || 1) }

	function hz (value, base) {
	  if (isStr(value)) {
	    base = base || 440
	    return Math.pow(2, (+value - 69) / 12) * base
	  } else {
	    return Math.abs(+value)
	  }
	}

	/* global XMLHttpRequest */

	/**
	 * Load a buffer
	 * @param {String} url
	 * @param {AudioContext} context
	 * @return {Function} a no-params function that returns the loaded buffer
	 * (or null if not loaded)
	 */
	function load (url, ac) {
	  var bf = null
	  function buffer () { return bf }

	  var promise = fetch(url, 'arraybuffer')
	    .then(decodeAudio(ac))
	    .then(function (result) { bf = result })
	  buffer.then = promise.then.bind(promise)
	  return buffer
	}

	/**
	 * Fetch url
	 * @param {String} url - the url
	 * @param {String} type - can be 'text' or 'arraybuffer'
	 * @return {Promise} a promise to the result
	 */
	function fetch (url, type) {
	  type = type === 'arraybuffer' ? type : 'text'
	  return new Promise(function (resolve, reject) {
	    var xhr = new XMLHttpRequest()

	    xhr.open('GET', url, true)
	    xhr.responseType = type

	    xhr.onload = function () {
	      if (xhr.response) {
	        resolve(xhr.response)
	      }
	    }
	    xhr.onerror = reject

	    xhr.send()
	  })
	}

	function decodeAudio (ac, arrayBuffer) {
	  if (arguments.length === 1) return function (array) { return decodeAudio(ac, array) }
	  return new Promise(function (resolve, reject) {
	    ac.decodeAudioData(arrayBuffer, resolve, reject)
	  })
	}

	var slice = Array.prototype.slice
	var isArray = Array.isArray

	// ROUTING
	// =======

	function sendTo (dest, node, time, delay) {
	  if (arguments.length > 1) return sendTo(dest)(node, time, delay)
	  return function (node, time, delay) {
	    node.connect(dest)
	    node.start(time, delay)
	    return node
	  }
	}

	var toMaster = sendTo(dest())

	/**
	 * Connect nodes in series: A -> B -> C -> D
	 * @param {Array<AudioNode>} nodes - the list of nodes to be connected
	 * @return {AudioNode} the resulting audio node
	 */
	function connect (nodes) {
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
	function add (nodes) {
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
	function constant (value, ac) {
	  // TODO: cache buffer
	  var ctx = context(ac)
	  var source = ctx.createBufferSource()
	  source.loop = true
	  source.buffer = ctx.createBuffer(1, 2, ctx.sampleRate)
	  var data = source.buffer.getChannelData(0)
	  data[0] = data[1] = value
	  return source
	}

	function signal (value, ac) {
	  var mod = context(ac).createGain()
	  var signal = connect(constant(value), mod)
	  signal.set = function (value, time) {
	    mod.gain.setValueAtTime(value, time)
	  }
	  return signal.start()
	}

	/**
	 * Create a node that bypasses the signal
	 * @param {AudioContext} context - (Optional) the audio context
	 * @return {AudioNode} the bypass audio node
	 */
	function bypass (ac) {
	  return context(ac).createGain()
	}

	/**
	 * Create a gain
	 */
	function gain (gain, ac) {
	  var amp = context(ac).createGain()
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
	  if (source.numberOfInputs) source = connect(constant(1, ctx), source)
	  var delta = max - min
	  return add(constant(min, ctx), mult(delta, source))
	}

	// OSCILLATORS
	// ===========

	/**
	 * Create an oscillator
	 */
	function osc (type, frequency, detune, ac) {
	  var osc = context(ac).createOscillator()
	  osc.type = type || 'sine'
	  return lifecycle(osc, [
	    plug('frequency', frequency, osc),
	    plug('detune', detune, osc)
	  ])
	}
	const sine = osc.bind(null, 'sine')
	const saw = osc.bind(null, 'sawtooth')
	const square = osc.bind(null, 'square')
	const triangle = osc.bind(null, 'triangle')

	// FILTERS
	// =======

	/**
	 * Create a filter
	 */
	function filter (type, frequency, Q, detune, ac) {
	  var filter = context(ac).createBiquadFilter()
	  filter.type = type
	  return lifecycle(filter, [
	    plug('frequency', frequency, filter),
	    plug('Q', Q, filter),
	    plug('detune', detune, filter)
	  ])
	}
	const lowpass = filter.bind(null, 'lowpass')
	const hipass = filter.bind(null, 'highpass')
	const bandpass = filter.bind(null, 'hipass')

	// MODULATORS
	// ==========

	/**
	 * Detune modulator. Can be connected to any `detune` param.
	 * Basically is a boilerplate code
	 * @example
	 * sine(300, detune(200, adshr(0.1, 0.2, 0.5, 1))))
	 * sine(300, detune(50, tempo(20)))
	 */
	function detune (cents, mod, ac) {
	  if (!isNum(cents)) cents = 50
	  if (isNum(mod)) mod = sine(mod, ac)
	  return mult(cents, mod)
	}

	/**
	 * Create a buffer source (sample player)
	 */
	function source (buffer, loop, detune, ac) {
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
	function generate (generators, samples, reverse, ac) {
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
	function white (samples, loop, ac) {
	  if (!isNum(samples)) samples = samplingRate(ac)
	  loop = loop !== false
	  return source(generate(whiteGen, samples, false, ac), loop, 0, ac)
	}
	function whiteGen () { return Math.random() * 2 - 1 }

	function schedule (param, shape, times, types, ac) {
	  return function (when, delay) {
	    console.log(shape, times, types)
	    var type
	    var time = toTime(context, when, delay)
	    var lt = times.length
	    var tp = types.length
	    shape.forEach(function (value, i) {
	      time += times[i % lt]
	      type = types[i % tp]
	      console.log(value, time, type)
	      if (type === 'set') param.setValueAtTime(value, time)
	      else if (type === 'exp') param.exponentialRampToValueAtTime(value === 0 ? 0.00001 : value, time)
	      else param.linearRampToValueAtTime(value, time)
	    })
	  }
	}

	function env (shape, times, types, ac) {
	  var ctx = context(ac)
	  var gain = ctx.createGain()
	  gain.gain.value = 0
	  gain.start = schedule(gain.gain, shape, times, types, ctx)
	  return gain
	}

	function toNum (num, def) { return isNum(num) ? num : def }
	/**
	 * An attack-decay-sustain-(hold)-decay envelope
	 */
	function adshr (attack, decay, sustain, hold, release, ac) {
	  attack = toNum(attack, 0.01)
	  decay = toNum(decay, 0.1)
	  sustain = toNum(sustain, 1)
	  hold = toNum(hold, 0)
	  release = toNum(release, 0.3)
	  return env([0, 1, sustain, sustain, 0],
	    [0, attack, decay, hold, release],
	    ['set', 'lin', 'set', 'exp'], ac)
	}

	/**
	 * An attack-decay envelope
	 */
	function perc (attack, decay, ac) {
	  return adshr(attack, 0, 1, 0, decay, ac)
	}

	function mix (wet, fx) {
	  if (!isNum(wet)) wet = 0.5
	  return add(gain(1 - 0.5), connect(fx, gain(wet)))
	}

	function bus (fx) {
	  return function (wet) { return mix(wet, fx) }
	}

	/**
	 * Create a feedback loop.
	 * @param {Integer} amount - the amount of signal
	 * @param {AudioNode} node - the node to feedback
	 * @param {AudioNode} ret - (Optional) the return fx
	 * @param {AudioContext} context - (Optional) the audio context
	 */
	function feedback (amount, signal, fx, ac) {
	  fx = fx || bypass(ac)
	  var feed = gain(amount, ac)
	  connect(fx, signal, feed)
	  feed.connect(fx)
	  return signal
	}

	function tremolo (rate, type, ac) {
	  type = type || 'sine'
	  return gain(osc(type, rate, ac), ac)
	}

	function dly (time, ac) {
	  var dly = context(ac).createDelay(5)
	  return lifecycle(dly, [
	    plug('delayTime', time, dly)
	  ])
	}

	function delay (time, filter, feedAmount, ac) {
	  if (!isNum(feedAmount)) feedAmount = 0.3
	  filter = isNum(filter) ? lowpass(filter, null, null, ac) : filter || bypass(ac)
	  return feedback(feedAmount, dly(time, ac), filter, ac)
	}

	var slice$1 = Array.prototype.slice

	/**
	 * @example
	 * var synth = withOptions(function (o) {
	 *    return connect(sine(o.frequency),
	 *      filter(o.filter.type, o.filter.frequency || o.frequency))
	 * }, { frequency: 440, filter: { type: 'lowpass' }}, ['frequency'])
	 * synth({ frequency: 'A4' })
	 * synth('A4')
	 */
	function withOptions (fn, config) {
	  config = config || {}
	  config.toOptions = config.toOptions || freqAndContextToOpts
	  return function (options) {
	    if (!isObj(options)) options = config.toOptions.apply(null, arguments)
	    return fn(Object.assign({}, config.defaults, options))
	  }
	}
	function freqAndContextToOpts (frequency, context) {
	  return { frequency: frequency, context: context }
	}

	/**
	 * A master output instrument. You can start nodes with it
	 *
	 * @example
	 * master.start(sine(300))
	 */
	var master = inst(null, dest())

	/**
	 * @example
	 * // an instrument with destination
	 * var synth = inst((fq) => sine(fq), dest())
	 * synth.start('A4')
	 * synth.stopAll()
	 * @example
	 * // only the destination
	 * var master = inst(null, connect(mix(0.2), reverb(), dest()))
	 * master.start(sine(300))
	 * master.start(sine(400))
	 * master.stopAll()
	 */
	function inst (synth, destination, maxVoices) {
	  var i = {}
	  var voices = initVoices(maxVoices)
	  i.start = function (value, time, delay, duration) {
	    var node = isFn(synth) ? synth(value) : value
	    if (destination) node.connect(destination)

	    trackNode(voices, node)
	    time = when(time, delay, contextOf(destination))
	    node.start(time)
	    if (duration) node.stop(time + duration)
	    return node
	  }
	  i.stop = function () { return stopAll(voices) }
	  i.inst = function (synth, maxVoices) { return inst(synth, destination, maxVoices) }
	  i.on = on.bind(null, i)
	  i.trigger = trigger.bind(null, i)
	  return i
	}

	function initVoices (limit) {
	  limit = limit || 0
	  return { limit: limit, all: {}, nextId: 0, current: 0, pool: new Array(limit) }
	}
	function trackNode (voices, node) {
	  node.id = voices.nextId++
	  voices.all[node.id] = node
	  return voices
	}
	function stopAll (voices) {
	  Object.keys(voices.all).forEach(function (id) {
	    voices.all[id].stop()
	  })
	}

	function on (target, event, callback) {
	  if (!event || event === '*') event = 'event'
	  var prev = target['on' + event]
	  target['on' + event] = function () {
	    if (prev) prev.apply(null, arguments)
	    callback.apply(null, arguments)
	  }
	}

	function trigger (target, event /*, ...values */) {
	  if (!isFn(target['on' + event])) return
	  var args = slice$1.call(arguments, 2)
	  target['on' + event].apply(null, args)
	  if (isFn(target.onevent)) target.onevent.apply(null, args)
	}

	function live () {
	  var names = []
	  Object.keys(window.SynthKit).forEach(function (name) {
	    window[name] = window.SynthKit[name]
	    names.push(name)
	  })
	  console.log('SynthKit live', 8, names.length)
	  console.log(names.join(', '))
	}

	exports.live = live;
	exports.context = context;
	exports.now = now;
	exports.dest = dest;
	exports.samplingRate = samplingRate;
	exports.seconds = seconds;
	exports.tempo = tempo;
	exports.hz = hz;
	exports.load = load;
	exports.decodeAudio = decodeAudio;
	exports.fetch = fetch;
	exports.connect = connect;
	exports.add = add;
	exports.toMaster = toMaster;
	exports.sendTo = sendTo;
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
	exports.filter = filter;
	exports.lowpass = lowpass;
	exports.hipass = hipass;
	exports.bandpass = bandpass;
	exports.detune = detune;
	exports.generate = generate;
	exports.source = source;
	exports.white = white;
	exports.adshr = adshr;
	exports.perc = perc;
	exports.mix = mix;
	exports.bus = bus;
	exports.feedback = feedback;
	exports.tremolo = tremolo;
	exports.dly = dly;
	exports.delay = delay;
	exports.inst = inst;
	exports.master = master;
	exports.withOptions = withOptions;

}));