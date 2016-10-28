export { context, now, dest, samplingRate, seconds } from './context'
export { tempo, hz } from './units'
export { load, decodeAudio, fetch } from './load'

export {
  // Routing
  connect, add, toMaster, sendTo,
  // Signal manipulation
  constant, bypass, gain, signal, mult, scale,
  // Oscillators
  osc, sine, saw, square, triangle,
  // Filters
  filter, lowpass, hipass, bandpass,
  // Modulators
  detune
} from './core'

export { buffer, sample, white } from './buffers'
export { adshr, perc } from './envelopes'
export { mix, bus, feedback, tremolo, dly, delay } from './effects'
export { inst, master, withOptions } from './instrument'

export function live () {
  var names = []
  Object.keys(window.SynthKit).forEach(function (name) {
    window[name] = window.SynthKit[name]
    names.push(name)
  })
  console.log('SynthKit live', 8, names.length)
  console.log(names.join(', '))
}
