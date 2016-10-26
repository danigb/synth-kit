export {
  // Routing
  connect, add,
  // Signal manipulation
  constant, gain, mult, scale,
  // Oscillators
  osc, sine, saw, square, triangle,
  // Filters
  filter, lowpass, hipass, bandpass,
  // Modulators
  detune
} from './core'

export { buffer, sample, white } from './buffers'
export { ahd, perc } from './envelopes'
export { samplingRate, now } from './utils'
export { mix, tremolo, dly } from './effects'

export function live () {
  Object.keys(window.SynthKit).forEach(function (name) {
    window[name] = window.SynthKit[name]
  })
}
