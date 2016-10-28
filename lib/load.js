/* global XMLHttpRequest */

/**
 * Load a remote audio file.
 * @param {String} url
 * @param {AudioContext} context - (Optional)
 * @return {Promise<AudioBuffer>} a promise that resolves to an AudioBuffer
 */
export function load (url, ac) {
  return fetch(url, 'arraybuffer').then(decodeAudio(ac))
}

/**
 * Fetch url
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

export function decodeAudio (ac, arrayBuffer) {
  if (arguments.length === 1) return function (array) { return decodeAudio(ac, array) }
  return new Promise(function (resolve, reject) {
    ac.decodeAudioData(arrayBuffer, resolve, reject)
  })
}
