// https://teichman.org/blog/2011/05/roto.html
// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
// http://www.dairiki.org/HammondWiki/OriginalHammondLeslieFaq
// http://www.stefanv.com/electronics/hammond_drawbar_science.html
var _ = require('..')

// http://electricdruid.net/technical-aspects-of-the-hammond-organ/
var RATIOS = [0.5, 1.498823530, 1, 2, 2.997647060, 4, 5.040941178, 5.995294120, 8]

/**
 * Create a poor man's hammond-like sound
 */
function b3 (preset, frequency) {
  if (typeof preset === 'string') preset = b3.presets[preset] || b3.parse(preset)
  else if (!Array.isArray(preset)) throw Error('Not valid B3 registration', preset)
  var osc = drawbars(preset)
  return frequency ? osc(frequency) : osc
}

b3.parse = function (str) {
  return (str.replace(/[^12345678]/g, '') + '00000000').slice(0, 9).split('').map(Math.abs)
}

// http://www.dairiki.org/HammondWiki/PopularDrawbarRegistrations
b3.presets = {
  gospel: b3.parse('88 8000 008'),
  blues: b3.parse('88 8800 000'),
  bluesB: b3.parse('88 5324 588'),
  booker: b3.parse('88 8630 000'),
  onions: b3.parse('80 8800 008'),
  smith: b3.parse('88 8000 000'),
  mcgriff: b3.parse('86 8600 006'),
  errol: b3.parse('80 0008 888'),
  genesis: b3.parse('33 6866 330')
}

function drawbars (preset) {
  var gains = null // lazy
  return function (frequency) {
    gains = gains || preset.map(function (n) {
      return _.dB(-3 * (8 - n))
    })
    return _.oscBank(frequency, RATIOS, ['sine'], gains)
  }
}

module.exports = b3
