import * as Kit from './kit'
import Asm from './asm/asm'
import * as Meter from './meter'

export default function SynthKit (ac, synth, dest) {
  return Asm(synth)(ac, dest)
}
exportTo(Kit, SynthKit)
exportTo(Meter, SynthKit)
SynthKit.live = function () { exportTo(SynthKit, window) }

function exportTo (kit, dest) {
  Object.keys(kit).forEach(function (name) {
    dest[name] = kit[name]
  })
}
