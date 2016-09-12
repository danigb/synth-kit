/* global SynthKit AudioContext Connect Add
  Gain Mod Meter Mix DelaySignal Reverb
  Sine Square Saw Lowpass Perc ADSR
*/
var ac = new AudioContext()
console.log(Object.keys(SynthKit))
SynthKit.live()
var out = SynthKit(ac, Meter(), true).start()

append(SynthKit.MeterCanvas(), document.getElementById('meter'))

addTitle(1, 'Synthkit node examples')

addTitle(2, 'Oscillators')
addExample('Sine', function () {
  var synth = Sine(800)
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('Sawtooth', function () {
  var synth = Connect(SynthKit.Saw(440), SynthKit.Gain(0.3))
  console.log('synth', synth)
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('Square', function () {
  var synth = Connect(SynthKit.Square(440), SynthKit.Gain(0.5))
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('Triangle', function () {
  var synth = Connect(SynthKit.Triangle(440), SynthKit.Gain(0.5))
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('PulseWave', function () {
  var synth = Connect(SynthKit.PulseWave(440, Sine(4)), SynthKit.Gain(0.3))
  // var synth = Connect(Sine(Mod(400, 2, aToG(Sine(0.5)))), Gain(0.2))
  SynthKit(ac, synth, out).start(null, 4)
})

addTitle(2, 'Routing')
addExample('Serial routing', function () {
  var synth = Connect(Square(800), Lowpass(300), Gain(5))
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('Parallel routing', function () {
  var synth = Add(Sine(440), Sine(442))
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('Plug: vibrato', function () {
  var synth = Sine(300, Connect(Sine(10), Gain(100)))
  SynthKit(ac, synth, out).start(null, 5)
})
addExample('Plug: mod', function () {
  var synth = Sine(Mod(440, 1, ADSR(1, 0.5, 0.5, 1, 0.1)))
  SynthKit(ac, synth, out).start(0, 5)
})
addExample('Plug: mod frequency', function () {
  var synth = Connect(Saw(1000), Lowpass(Mod(440, 3, Perc(0, 5))), ADSR())
  SynthKit(ac, synth, ac.destination).start(0, 2)
})
addExample('Plug: tremolo', function () {
  var synth = Connect(Sine(440), Gain(Square(2)))
  SynthKit(ac, synth, out).start(null, 4)
})

addTitle(2, 'Envelopes')
addExample('Percutive', function () {
  var synth = Connect(Square(880), Perc(null, 1))
  SynthKit(ac, synth, out).start()
})
addExample('Simple ADSR', function () {
  var synth = Connect(Sine(440), ADSR(0.5, 0.5, 0.3, 3))
  SynthKit(ac, synth, out).start()
})
addExample('Modulate frequency', function () {
  var synth = Connect(Saw(Mod(1000, 1, SynthKit.Perc(1))))
  SynthKit(ac, synth, out).start(0, 1)
})
addExample('Scale envelope adsr', function () {
  var synth = Connect(
    SynthKit.Saw(SynthKit.Scale(400, 800, SynthKit.ADSR(0.5, 0.5, 0.5, 1)))
  )
  synth(ac).connect(output).start()
})


addTitle(2, 'Filters')
addExample('Lowpass', function () {
  var synth = Connect(SynthKit.Saw(1200), SynthKit.Lowpass(600))
  SynthKit(ac, synth, out)(ac).start(null, 1)
})

addTitle(2, 'Buffers')
addExample('White Noise', function () {
  var synth = SynthKit.White()
  SynthKit(ac, synth, out).start(null, 1)
})
addExample('Pulse', function () {
  var synth = SynthKit.Pulse(0.01)
  SynthKit(ac, synth, out).start(null, 1)
})

addTitle(2, 'Effects')
addExample('DelaySignal', function () {
  var synth = (freq) => Connect(Saw(freq), Perc(), Mix(0.2, DelaySignal(0.2)))
  SynthKit(ac, synth(400), out).start()
})
addExample('Reverb', function () {
  var synth = (revLevel) => Connect(Sine(800), Perc(), Reverb(revLevel, 4, 3))
  SynthKit(ac, synth(0), out).start(ac.currentTime)
  SynthKit(ac, synth(0.4), out).start(ac.currentTime + 1)
  SynthKit(ac, synth(0.8), out).start(ac.currentTime + 2)
})
addExample('Overdrive', function () {
  var Synth = (drive) => Connect(
    SynthKit.Saw(440), SynthKit.Overdrive(drive), SynthKit.Perc(0.1, 0.2, 2)
  )
  start(ac, Synth(0), output, ac.currentTime)
  start(ac, Synth(0.5), output, ac.currentTime + 1)
  start(ac, Synth(0.9), output, ac.currentTime + 2)
})

addTitle(2, 'Instruments')
addTitle(3, 'Drums')
addExample('Cowbell', function () {
  start(ac, SynthKit.Cowbell(), output)
})
addExample('Clave', function () {
  start(ac, SynthKit.Clave(), output)
})

addExample('Kick', function () {
  start(ac, SynthKit.Kick(), output)
})

addExample('Snare', function () {
  start(ac, SynthKit.Snare(), output)
})

addExample('Maracas', function () {
  start(ac, SynthKit.Maracas(), output)
})

addExample('Cymbal', function () {
  start(ac, SynthKit.Cymbal(), output)
})

addTitle(3, 'Synths')
addExample('Bells', function () {
  start(ac, SynthKit.Bell(880), output)
})
addExample('Organ', function () {
  start(ac, SynthKit.Organ(880), output, null, 1)
})
addExample('Marimba', function () {
  start(ac, SynthKit.Marimba(440), output)
})
addExample('One', function () {
  start(ac, SynthKit.One(440), output, null, 0.2)
})
addExample('Duo', function () {
  start(ac, SynthKit.Duo(440), output, null, 0.2)
  start(ac, SynthKit.Duo(500), output, ac.currentTime + 1, 0.2)
})

addExample('AM', function () {
  function ToGain () {
    return SynthKit.WaveShaper(SynthKit.WaveShaperCurve('audioToGain', function (i) {
      return (i + 1) / 2
    }))
  }
  function FiltEnv (freq, octaves, attack, release) {
    return SynthKit.Scale(freq, freq * octaves, SynthKit.Perc(attack, release))
  }
  var Synth = function (freq, harmonicity) {
    harmonicity = harmonicity || 3
    return Connect(
      SynthKit.Sine(freq),
      SynthKit.Gain(Connect(
        SynthKit.Square(freq * harmonicity),
        SynthKit.ADSR(0.5, 0, 1, 1),
        ToGain()
      )),
      SynthKit.Lowpass(FiltEnv(freq, 7, 0.5, 2)),
      SynthKit.ADSR(null, null, null, 2)
    )
  }
  start(ac, Synth(440), output, null, 0.2)
})

// //// HELPERS //////

var main
function append (el, parent) {
  main = main || document.getElementById('main')
  parent = parent || main
  parent.appendChild(el)
}

function addTitle (num, text) {
  var title = document.createElement('h' + num)
  title.innerHTML = text
  append(title)
}

function addExample (name, cb) {
  var a = document.createElement('a')
  a.innerHTML = name
  a.href = '#'
  a.onclick = function (e) {
    e.preventDefault()
    cb()
  }
  append(a)
  var sep = document.createElement('span')
  sep.innerHTML = '&nbsp;|&nbsp;'
  append(sep)
}
