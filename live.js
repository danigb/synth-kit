var SynthKit = require('.')
SynthKit.start = SynthKit.master.start
SynthKit.stop = SynthKit.master.stop

SynthKit.b3 = require('./instruments/b3')
SynthKit.sf = require('./instruments/soundfont').instrument
SynthKit.tr808 = require('./instruments/tr808')
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
  console.log('SynthKit live', 10, names.length)
  console.log(names.join(', '))
}

module.exports = SynthKit
