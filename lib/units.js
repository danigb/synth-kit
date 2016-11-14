/**
 * This module provides some conversion utilities between different units
 * used when dealing with audio
 *
 * @example
 * import { noteToFreq } from 'synth-kit'
 *
 * noteToFreq('A4') // => 440
 * @module units
 */
import Note from 'note-parser'
var pow = Math.pow

/**
 * Convert from note midi number to frequency
 * @param {Number} midi - the midi note number (can have decimals)
 * @param {Number} tuning - (Optional) the frequency of a reference A4 note (440 by default)
 * @return {Number} the note frequency
 * @example
 * midiToFreq(69) // => 440
 * midiToFreq(69.5) // => 452.8929841231365
 * midiToFreq(70) // => 466.1637615180899
 */
export function midiToFreq (value, base) { return pow(2, (+value - 69) / 12) * (base || 440) }

/**
 * Convert from note name to frequency
 * @function
 * @param {String} note - the note name
 * @param {Number} tuning - (Optional) the tuning of A4 (440 by default)
 * @return {Number} the note frequency
 * @example
 * noteToFreq('C3') // => 130.8127826502993
 */
export var noteToFreq = Note.freq

/**
 * Convert from beats per minute to hertzs
 *
 * @param {Integer} bpm - the tempo
 * @param {Integer} sub - (Optional) subdivision (default 1)
 * @return {Float} the tempo expressed in hertzs
 * @example
 * tempoToFreq(120) // => 2
 * tempoToFreq(120, 4) // => 8
 */
export function tempoToFreq (bpm, sub) { return (bpm / 60) * (sub || 1) }

/**
 * Convert decibels into gain.
 * @param  {Number} db
 * @return {Number} the gain (from 0 to 1)
 * @example
 * dBToGain(-3) // => 0.7071067811865475
 */
export function dBToGain (db) { return pow(2, db / 6) }

/**
 * Convert from level (an equal power scale from 0 to 100) into gain.
 * @param {Number} level - from 0 to 100
 * @return {Number} gain (from 0 to 1)
 * @example
 * levelToGain(80) // => 0.9510565162951535
 */
export function levelToGain (level) { return Math.sin(0.5 * Math.PI * level / 100) }

/**
 * Convert gain to decibels.
 * @param  {Number} gain (0-1)
 * @return {Decibels}
 * @example
 * s.gainToDb(0.3) // => -10.457574905606752
 */
export function gainToDb (gain) { return 20 * (Math.log(gain) / Math.LN10) }
