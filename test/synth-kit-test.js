require('web-audio-test-api')
var test = require('tape')
var SynthKit = require('..')

test('SynthKit', function (t) {
  t.assert(SynthKit)
  t.end()
})
