var slice = Array.prototype.slice

// ROUTING
// =======
export function Destination (/* nodes */) {
  var nodes = slice.call(arguments)
  nodes.push(['Destination', {}])
  return ['Connect', { type: 'serial', nodes: nodes }]
}
export function Connect (/* nodes */) {
  return ['Connect', { type: 'serial', nodes: slice.call(arguments) }]
}
export function Add (/* nodes */) {
  return ['Connect', { type: 'parallel', nodes: slice.call(arguments) }]
}

// VOLUME
// ======
export function Gain (gain) {
  return ['Gain', { gain: gain }]
}
export function Bypass () {
  return ['Gain', { gain: 1 }]
}

// OSCILLATORS
// ===========
export function Osc (type, freq, detune) {
  return ['Oscillator', { type: type, frequency: freq, detune: detune }]
}
export function Sine (freq, detune) { return Osc('sine', freq, detune) }
export function Saw (freq, detune) { return Osc('sawtooth', freq, detune) }
export function Square (freq, detune) { return Osc('square', freq, detune) }
export function Triangle (freq, detune) { return Osc('triangle', freq, detune) }

// https://github.com/cwilso/oscilloscope/blob/master/js/audio.js
export function PulseWave (freq, duty) {
  return Connect(
    Add(Saw(freq), Signal(duty)), Shape('square')
  )
}

// FILTERS
// =======
export function Filter (type, freq, Q) {
  return ['BiquadFilter', { type: type, frequency: freq, Q: Q }]
}
export function Lowpass (freq, Q) { return Filter('lowpass', freq, Q) }
export function Hipass (freq, Q) { return Filter('hipass', freq, Q) }
export function Bandpass (freq, Q) { return Filter('bandpass', freq, Q) }

// ENVELOPES
// =========
export function Envelope (attack, release) {
  return ['Envelope', { attack: attack, release: release }]
}

// BUFFERS
// =======
export function Buffer (duration, generator, length) {
  return ['Buffer', { duration: duration, length: length, generator: generator }]
}
export function Source (buffer, detune, loop) {
  return ['BufferSource', { buffer: buffer, detune: detune, loop: loop }]
}
export function White (duration, length) {
  return Source(Buffer(duration, 'white', length))
}

// ENVELOPES
// =========

export function Perc (attack, decay, max, min) {
  return Envelope([
    'set', min || 0, 0,
    'lin', max || 1, attack || 0.001,
    'exp', min || 0, decay || 0.1
  ])
}

export function AD (attack, decay, hold, max, min) {
  return Envelope([
    'set', min || 0, 0,
    'lin', max || 1, attack || 0.001,
    'set', max || 1, hold || 0,
    'lin', min || 0, decay || 0.1
  ])
}
export function ADSR (attack, decay, sustain, release, hold, max, min) {
  return Envelope([
    'set', min || 0, 0,
    'lin', max || 1, attack || 0.001,
    'lin', sustain || 0.8, decay || 0.1,
    'set', sustain || 0.8, hold || 0
  ], release ? ['lin', min || 0, release] : null)
}

// WAVE SHAPERS
export function WaveShaper (curve, oversample) {
  return ['WaveShaper', { curve: curve }]// , oversample: 'none' }]
}
export function WaveShaperCurve (type, length) {
  return ['WaveShaperCurve', { generator: type, length: length || 1024 }]
}
export function Shape (type, length) {
  return WaveShaper(WaveShaperCurve(type, length))
}

// Audio to gain
export function aToG (Signal) {
  return Connect(Signal, Shape('audio-to-gain'))
}

// EFFECTS
export function Mix (amount, Effect, compensate) {
  var gain = compensate ? 1 - amount : 1
  return Add(Gain(gain), Connect(Effect, Gain(amount)))
}
export function DelaySignal (delayTime, maxDelay) {
  return ['Delay', { delayTime: delayTime, maxDelay: maxDelay || 2 * delayTime }]
}
export function ReverbIR (duration, decay, attack, reverse) {
  return ['Buffer', {
    numOfChannels: 2, generator: 'white', duration: duration,
    decay: decay || (duration / 1.2), attack: attack || 0, reverse: reverse
  }]
}
export function Convolver (buffer, normalize) {
  return ['Convolver', { buffer: buffer, normalize: normalize }]
}
export function Reverb (amount, duration, decay, reverse) {
  var key = 'RevIR' + duration + '|' + decay + (reverse ? 'r' : '')
  var IR = Memo(key, ReverbIR(duration, decay, 0.1, reverse))
  return Mix(amount, Convolver(IR))
}

// UTILITY
// =======
export function Pulse () {
  return Source(Memo('pulse', Buffer(0, 'pulse', 2)), 0, true)
}

/**
 * Create a source that generates a signal.
 */
export function Signal (value) {
  return Connect(Pulse(), Gain(value))
}

/**
 * Inverse the signal
 */
export function Inverse () {
  return Gain(-1)
}

export function Memo (id, node) {
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
export function Mod (value, amount, source) {
  return Add(
    Signal(value),
    Connect(Pulse(), source, Gain(value * amount))
  )
}
