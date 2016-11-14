/* global XMLHttpRequest */
import { context } from './context'

var NONE = {}
/**
 * This module contains some functions to fetch and decode audio files.
 *
 * @module load
 */

/**
 * Load a remote audio file and return a promise.
 * @param {String} url
 * @param {Object} options - (Optional) may include:
 *
 * - context: the audio context
 *
 * @return {Promise<AudioBuffer>} a promise that resolves to an AudioBuffer
 * @example
 * load('sound.mp3').then(function (buffer) {
 *   sample(buffer, true).start()
 * }
 */
export function load (url, opts) {
  opts = opts || NONE
  return fetch(url, 'arraybuffer').then(decodeAudio(context(opts.context)))
}

/**
 * Fetch an url and return a promise
 * @param {String} url - the url
 * @param {String} type - can be 'text' or 'arraybuffer'
 * @return {Promise} a promise to the result
 */
export function fetch (url, type) {
  type = type === 'arraybuffer' ? type : 'text'
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest()

    xhr.open('GET', url, true)
    xhr.responseType = type

    xhr.onload = function () {
      if (xhr.response) {
        resolve(xhr.response)
      }
    }
    xhr.onerror = reject

    xhr.send()
  })
}

/**
 * Decode an array buffer into an AudioBuffer.
 * @param {AudioContext} context - (Optional) the context to be used (can be null to use
 * synth-kit's default audio context)
 * @param {Array} array - (Optional) the array to be decoded. If not given,
 * it returns a function that decodes the buffer so it can be chained with
 * fetch function (see example)
 * @return {Promise<AudioBuffer>} a promise that resolves to an audio buffer
 * @example
 * fecth('sound.mp3').then(decodeAudio())
 */
export function decodeAudio (ac, arrayBuffer) {
  if (arguments.length === 1) return function (array) { return decodeAudio(ac, array) }
  return new Promise(function (resolve, reject) {
    ac.decodeAudioData(arrayBuffer, resolve, reject)
  })
}
