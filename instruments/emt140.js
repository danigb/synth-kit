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
