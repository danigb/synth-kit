var SynthKit = require('.')
window.log = function (name) {
  return console.log.bind(console, name)
}
SynthKit.start = SynthKit.master.start
SynthKit.stop = SynthKit.master.stop

var basic = require('./instruments/basic')
SynthKit.ping = basic.ping

SynthKit.b3 = require('./instruments/b3')
SynthKit.sf = require('./instruments/soundfont').instrument
SynthKit.tr808 = require('./instruments/tr808')
SynthKit.emt140 = require('./instruments/emt140')
var sfnames = require('./instruments/sf-names.json')

SynthKit.sf.names = function (group, num) {
  return !group ? Object.keys(sfnames)
    : num ? sfnames[group][num - 1] : sfnames[group]
}
SynthKit.sf.search = function (str) {
  str = str.toLowerCase()
  var results = []
  Object.keys(sfnames).forEach(function (group) {
    sfnames[group].forEach(function (name) {
      if (name.toLowerCase().includes(str)) results.push(name)
    })
  })
  return results
}
SynthKit.live = function () {
  var names = []
  Object.keys(SynthKit).forEach(function (name) {
    window[name] = SynthKit[name]
    names.push(name)
  })
  window.inst = function (synth, dest, opts) {
    var i = SynthKit.inst(synth, dest, opts)
    i.on('ready', function (_, name) {
      console.log('Instrument ready: ', name)
    })
    return i
  }
  console.log('SynthKit live', 200, names.length)
  console.log(names.sort().join(', '))
}

module.exports = SynthKit
