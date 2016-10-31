/**
 * Simple utilities shared between all the modules
 * @module utils
 * @private
 */

/**
 * Empty options object (treat is as immutable)
 * @private
 */
export var OPTS = {}

/**
 * typeof shortcut
 * @private
 */
export function isA (t, x) { return typeof x === t }

/**
 * Ensure the value is an array
 * @private
 */
export function toArr (arr) { return Array.isArray(arr) ? arr : [ arr ] }

/**
 * The array.slice function unbinded
 * @private
 */
export var slice = Array.prototype.slice

/**
 * Test if its an array
 * @private
 */
export var isArray = Array.isArray

/**
 * Object.assign function
 * @private
 */
export var assign = Object.assign

/**
 * Poor man's pluck
 * @private
 */
export function pluck (name, def) { return function (obj) { return obj[name] || def } }
