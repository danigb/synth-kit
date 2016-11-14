import Note from 'note-parser'
var pow = Math.pow

/**
 * Convert from beats per minute to hertzs
 * @param {Integer} bpm - the tempo
 * @param {Integer} sub - (Optional) subdivision (default 1)
 * @return {Float} the tempo expressed in hertzs
 */
export function tempo (bpm, sub) { return (bpm / 60) * (sub || 1) }

/**
 * Get frequency of a note. The note can be a note name in scientific
 * notation (for example: 'C#2') or a midi number
 */
export function note (name, base) {
  return Note.freq(name)
}

export function hz (value, base) {
  if (typeof value === 'string') {
    base = base || 440
    return pow(2, (+value - 69) / 12) * base
  } else {
    return Math.abs(+value)
  }
}

/**
 *  Convert decibels into gain.
 *  @param  {Number} db
 *  @return {Number} the gain (from 0 to 1)
 */
export function dBToGain (db) { return pow(2, db / 6) }

/**
 *  Convert gain to decibels.
 *  @param  {Number} gain (0-1)
 *  @return {Decibels}
 */
export function gainToDb (gain) { return 20 * (Math.log(gain) / Math.LN10) }
