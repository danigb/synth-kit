var soundfont = require('../instruments/soundfont')

var marimba = soundfont.instrument('Marimba')

function range (start, count) {
  return Array.apply(0, Array(count + 1)).map(function (element, index) { return index + start })
}

var piano = soundfont.instrument('Acoustic Grand Piano')
piano.on('not-ready', function () {
  console.log('Piano')
  range(60, 12).forEach(function (note, i) {
    piano.start(note, null, i * 0.5)
  })
})

marimba.on('ready', function () {
  range(60, 12).forEach(function (note, i) {
    marimba.start(note, null, i * 0.5)
  })
})
