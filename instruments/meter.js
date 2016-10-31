
var cache = {}

export function MeterCanvas (id, width, height) {
  id = id || ''
  if (!cache[id]) {
    cache[id] = document.createElement('canvas')
    cache[id].width = 600
    cache[id].height = 100
  }
  return cache[id]
}

export function Meter (props) {
  return function (ac) {
    var canvas = canvas || MeterCanvas()
    var ctx = canvas.getContext('2d')
    var w = canvas.width
    var h = canvas.height
    var running = false
    var analyser = ac.createAnalyser()
    var spectrum = Spectrum(analyser, w, h)
    var oscilloscope = Oscilloscope(analyser, w, h)
    analyser.fftSize = 1024
    analyser.start = function () {
      console.log('Start meter')
      running = true
      function paint () {
        ctx.clearRect(0, 0, w, h)
        spectrum(ctx)
        oscilloscope(ctx)
        if (running) window.requestAnimationFrame(paint)
      }
      window.requestAnimationFrame(paint)
    }
    return analyser
  }
}

function Spectrum (analyser, width, height) {
  var length = analyser.frequencyBinCount
  var data = new Uint8Array(length)
  var limit = Math.min(width, length)
  var ratio = height / 280
  var barHeight

  return function (ctx) {
    analyser.getByteFrequencyData(data)
    ctx.lineWidth = 0.5
    for (var i = 0; i < limit; i++) {
      barHeight = data[i]
      if (barHeight >= data[i + 1] && barHeight > data[i - 1]) {
        ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)'
      } else {
        ctx.fillStyle = '#dedede'
      }
      ctx.fillRect(i, height - barHeight * ratio, 1, barHeight * ratio)
    }
  }
}

function Oscilloscope (analyser, width, height) {
  var zero, x
  var length = analyser.frequencyBinCount
  var limit = Math.min(length, width)
  var buffer = new Uint8Array(length)
  var scaling = height / 256

  return function draw (ctx) {
    analyser.getByteTimeDomainData(buffer)
    ctx.lineWidth = 0.5
    ctx.beginPath()
    zero = findFirstPositiveZeroCrossing(buffer, limit)
    for (x = 0; x < limit; x++) {
      ctx.lineTo(x, (256 - buffer[x + zero]) * scaling)
    }
    ctx.stroke()
  }
}

var ZERO = 128
var MINVAL = ZERO + 6

function findFirstPositiveZeroCrossing (buf, length) {
  var i = 0
  var lastZero = -1

  // advance until we're zero or negative
  while (i < length && buf[i] > ZERO) i++

  if (i >= length) return 0

  // advance until we're above MINVAL, keeping track of last zero.
  while (i < length && buf[i] < MINVAL) {
    if (buf[i] >= 128 && lastZero === -1) {
      lastZero = i
    }
    i++
  }

  // we may have jumped over MINVAL in one sample.
  if (lastZero === -1) lastZero = i

  if (i === length) return 0  // We didn't find any positive zero crossings

  return lastZero
}
