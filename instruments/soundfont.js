var _ = require('..')
var Note = require('note-parser')
function is (t, x) { return typeof x === t }

var GLEITZ = 'https://gleitz.github.io/midi-js-soundfonts/'
function isSoundfontURL (name) { return /\.js(\?.*)?$/i.test(name) }
/**
 * Get the url of a soundfont name
 */
function url (name, sf, format) {
  if (isSoundfontURL(name)) return name
  format = format === 'ogg' ? '-ogg' : '-mp3'
  sf = sf === 'FluidR3_GM' ? 'FluidR3_GM/' : 'MusyngKite/'
  return GLEITZ + sf + name.toLowerCase().replace(/\s+/g, '_') + format + '.js'
}

var LOAD_DEFAULTS = {
  format: 'mp3', soundfont: 'MusyngKite',
  fetch: _.fetch, decodeAudio: _.decodeAudio
}

/**
 * Load a MIDI.js prerendered soundfont file.
 * load('Acoustic Grand Piano').then(function (buffers) {
 *  buffer[60] // => <AudioBuffer> for midi note 60 ('C4')
})
 */
function load (name, options) {
  var o = Object.assign({}, options, LOAD_DEFAULTS)
  var promise = is('function', name.then) ? name
    : o.fetch(url(name, o.soundfont, o.format), 'text')
  return promise.then(decodeSoundfont(o.context, o.decodeAudio))
}

var INST_DEFAULTS = {
  gain: 1, filter: { type: 'lowpass', frequency: '22000' },
  attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.4
}

/**
 * Create a soundfont instrument.
 * The configuration object can contain the following options:
 * @param {String} name - the soundfont name
 * @param {Object} options - (Optional) soundfont options
 * @return {Instrument} the soundfont instrument
 * @example
 * var piano = Soundfont.instrument('Acoustic Grand Piano', { gain: 1.5 })
 * piano.on('ready', function () {
 *    piano.start('C4')
 * })
 */
function instrument (name, config) {
  var buffers = null
  var sample = function (midi) {
    if (buffers) return buffers[midi]
    console.warn('Instrument "' + name + '" not loaded yet.')
    return _.gen(function () { return 0 }, 2)
  }
  var synth = function (o) {
    console.log('sf synth', o)
    return _.connect(
      _.source(sample(o.midi), o),
      _.filter(o.filter.type, o.filter.frequency, o.filter),
      /* adsr(o), */
      _.gain(o)
    )
  }

  synth = _.withOptions(synth, {
    defaults: Object.assign({}, INST_DEFAULTS, config),
    toOptions: toOptions,
    prepare: prepareOptions
  })
  var sf = _.inst(synth, _.dest())
  load(name, config).then(function (result) {
    buffers = result
    sf.event('ready', sf, name)
  })
  return sf
}

function toOptions (note, context) {
  return is('number', note) ? { midi: note, context: context }
    : { note: note, context: context }
}

function prepareOptions (o) {
  var note = Note.parse(o.name || o.note)
  if (!o.note && note) o.note = Note.build(note)
  if (!o.midi && note) o.midi = note.midi
  if (!o.frequency && o.midi) o.frequency = Math.pow(2, (o.midi - 69) / 12) * 440
  if (!o.detune) {
    o.detune = Math.floor((o.midi % 1) * 100)
    if (o.detune) o.midi = Math.floor(o.midi)
  }
  return o
}

/**
 * Decode a soundfont text into a map of midi notes to audio buffers.
 * Can be partially applied.
 *
 * @param {AudioContext} - the audio context (or null to use the default context)
 * @param {String} content - the midi.js encoded soundfont text
 */
function decodeSoundfont (ac, decodeAudio) {
  var ctx = _.context(ac)
  return function (content) {
    var sf = parseMidijs(content)
    var names = Object.keys(sf)
    var promises = names.map(function (name) {
      return Promise.resolve(sf[name]).then(decodeBase64Audio).then(decodeAudio(ctx))
    })
    return Promise.all(promises).then(function (bufferList) {
      return names.reduce(function (buffers, name, i) {
        buffers[Note.midi(name)] = bufferList[i]
        return buffers
      }, {})
    })
  }
}

function parseMidijs (data) {
  var begin = data.indexOf('MIDI.Soundfont.')
  if (begin < 0) throw Error('Invalid MIDI.js Soundfont format')
  begin = data.indexOf('=', begin) + 2
  var end = data.lastIndexOf(',')
  return JSON.parse(data.slice(begin, end) + '}')
}

function decodeBase64Audio (source) {
  var i = source.indexOf(',')
  return base64Decode(source.slice(i + 1)).buffer
}

// DECODE UTILITIES
function b64ToUint6 (nChr) {
  return nChr > 64 && nChr < 91 ? nChr - 65
    : nChr > 96 && nChr < 123 ? nChr - 71
    : nChr > 47 && nChr < 58 ? nChr + 4
    : nChr === 43 ? 62
    : nChr === 47 ? 63
    : 0
}

// Decode Base64 to Uint8Array
// ---------------------------
function base64Decode (sBase64, nBlocksSize) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, '')
  var nInLen = sB64Enc.length
  var nOutLen = nBlocksSize
    ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize
    : nInLen * 3 + 1 >> 2
  var taBytes = new Uint8Array(nOutLen)

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255
      }
      nUint24 = 0
    }
  }
  return taBytes
}

module.exports = { url: url, load: load, instrument: instrument }
