/* global XMLHttpRequest */

/**
 * Load a buffer
 * @param {String} url
 * @param {AudioContext} context
 * @return {Function} a no-params function that returns the loaded buffer
 * (or null if not loaded)
 */
export function load (url, ac) {
  var bf = null
  function buffer () { return bf }

  var promise = fetch(url, 'arraybuffer')
    .then(decodeAudio(ac))
    .then(function (result) { bf = result })
  buffer.then = promise.then.bind(promise)
  return buffer
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
