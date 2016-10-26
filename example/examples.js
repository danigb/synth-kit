/* global SynthKit connect sine saw square triangle gain lowpass
  detune scale add perc
*/
SynthKit.live()

// var out = SynthKit(ac, Meter(), true).start()

// append(MeterCanvas(), document.getElementById('meter'))

addTitle(1, 'Synthkit node examples')

addTitle(2, 'Oscillators')
addExample('Sine', function () {
  connect(sine(800)).start(0, 0, 1)
})

addExample('Sawtooth', function () {
  connect(saw(440), gain(0.3)).start(0, 0, 1)
})
addExample('Square', function () {
  connect(square(440), gain(0.4)).start(0, 0, 1)
})
addExample('Triangle', function () {
  connect(triangle(440), gain(0.5)).start(0, 0, 1)
})
addExample('PulseWave', function () {
})

addTitle(2, 'Routing')
addExample('Serial routing', function () {
  connect(square(800), lowpass(300), gain(5)).start(0, 0, 1)
})
addExample('Parallel routing', function () {
  add(sine(440), sine(442)).start(0, 0, 1)
})
addTitle(2, 'Modulation')
addExample('Detune', function () {
  sine(1000, detune(15, 10)).start(0, 0, 1)
})
addExample('Frequency by an oscillator', function () {
  sine(scale(400, 800, sine(2.5))).start(0, 0, 1)
})
addExample('Frequency by an envelope', function () {
  sine(scale(400, 800, perc(0.5, 0.5))).start(0, 0, 1)
})

addTitle(2, 'Envelopes')
addExample('Percutive', function () {
  connect(square(880), perc()).start(0, 0, 1)
})
addExample('AHD', function () {
  connect(sine(880), ahd(1, 1, 1)).start(0, 0, 5)
})
addExample('ADSR', function () {
  connect(sine(880), adsr()).start(0, 0, 1)
})


addTitle(2, 'Filters')
addExample('lowpass', function () {
  connect(saw(1200), lowpass(400)).start(0, 0, 1)
})

addTitle(2, 'Buffers')
addExample('White Noise', function () {
  connect(white(), perc(null, 1)).start(0, 0, 1)
})
addExample('Pulse', function () {
  var synth = Pulse(0.01)
})

addTitle(2, 'Effects')
addExample('DelaySignal', function () {
  var synth = (freq) => connect(Saw(freq), Perc(), Mix(0.2, DelaySignal(0.2)))
})
addExample('Reverb', function () {
  var synth = (revLevel) => connect(sine(800), Perc(), Reverb(revLevel, 4, 3))
  SynthKit(ac, synth(0), out).start(ac.currentTime)
  SynthKit(ac, synth(0.4), out).start(ac.currentTime + 1)
  SynthKit(ac, synth(0.8), out).start(ac.currentTime + 2)
})
addExample('Overdrive', function () {
  var Synth = (drive) => connect(
    Saw(440), Overdrive(drive), Perc(0.1, 0.2, 2)
  )
  start(ac, Synth(0), output, ac.currentTime)
  start(ac, Synth(0.5), output, ac.currentTime + 1)
  start(ac, Synth(0.9), output, ac.currentTime + 2)
})

addTitle(2, 'Instruments')
addTitle(3, 'Drums')
addExample('Cowbell', function () {
  start(ac, Cowbell(), output)
})
addExample('Clave', function () {
  start(ac, Clave(), output)
})

addExample('Kick', function () {
  start(ac, Kick(), output)
})

addExample('Snare', function () {
  start(ac, Snare(), output)
})

addExample('Maracas', function () {
  start(ac, Maracas(), output)
})

addExample('Cymbal', function () {
  start(ac, Cymbal(), output)
})

addTitle(3, 'Synths')
addExample('Bells', function () {
  start(ac, Bell(880), output)
})
addExample('Organ', function () {
  start(ac, Organ(880), output, null, 1)
})
addExample('Marimba', function () {
  start(ac, Marimba(440), output)
})
addExample('One', function () {
  start(ac, One(440), output, null, 0.2)
})
addExample('Duo', function () {
  start(ac, Duo(440), output, null, 0.2)
  start(ac, Duo(500), output, ac.currentTime + 1, 0.2)
})

addExample('AM', function () {
  function Togain () {
    return WaveShaper(WaveShaperCurve('audioTogain', function (i) {
      return (i + 1) / 2
    }))
  }
  function FiltEnv (freq, octaves, attack, release) {
    return Scale(freq, freq * octaves, Perc(attack, release))
  }
  var Synth = function (freq, harmonicity) {
    harmonicity = harmonicity || 3
    return connect(
      sine(freq),
      gain(connect(
        square(freq * harmonicity),
        ADSR(0.5, 0, 1, 1),
        Togain()
      )),
      lowpass(FiltEnv(freq, 7, 0.5, 2)),
      ADSR(null, null, null, 2)
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
