import { isStr } from './utils'

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

}

export function hz (value, base) {
  if (isStr(value)) {
    base = base || 440
    return Math.pow(2, (+value - 69) / 12) * base
  } else {
    return Math.abs(+value)
  }
}
