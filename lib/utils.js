import context from 'audio-context'
export function isNum (n) { return typeof n === 'number' }
export function isFn (x) { return typeof x === 'function' }

export var ac = context

// CONVERSION
// ==========

/**
 * Convert from seconds to samples (using AudioContext sampling rate)
 * @param {Float} seconds - the number of seconds
 * @param {AudioContext} context - (Optional) the audio context
 * @return {Integer} the number of samples
 * @example
 * white(dur(1.2)) // => generate 1.2seconds of white noise
 */
export function dur (secs, context) { return secs * samplingRate(context) }

/**
 * Convert from beats per minute to hertzs
 * @param {Integer} bpm - the tempo
 * @param {Integer} sub - (Optional) subdivision (default 1)
 * @return {Float} the tempo expressed in hertzs
 */
export function tempo (bpm, sub) { return (bpm / 60) * (sub || 1) }

/**
 * Get audio context's current time
 */
export function now (context) { return (context || ac).currentTime }

/**
 * Get sampling rate
 */
export function samplingRate (context) { return (context || ac).sampleRate }

/**
 * Plug something (a value, a node) into a node parameter
 */
export function plug (name, value, node) {
  if (typeof value === 'undefined') {
    // do nothing
  } else if (typeof value.connect === 'function') {
    node[name].value = 0
    value.connect(node[name])
    return value
  } else if (node[name]) {
    node[name].value = value
  }
}

// TODO: export?
// Get time for a given `when` and  `delay` parameters
export function toTime (context, when, delay) {
  return Math.max(context.currentTime, when || 0) + (delay || 0)
}

function bindLifecycle (node) {
  return {
    connect: node.connect ? node.connect.bind(node) : null,
    disconnect: node.disconnect ? node.disconnect.bind(node) : null,
    start: node.start ? node.start.bind(node) : null,
    stop: node.stop ? node.stop.bind(node) : null
  }
}

function dispatch (event, value, node, dependents) {
  if (node[event]) node[event](value)
  dependents.forEach(function (dep) {
    if (dep && dep[event]) dep[event](value)
  })
  return node
}

/**
 * Override node functions to handle better the node's lifecycle
 */
export function lifecycle (node, dependents) {
  var raw = bindLifecycle(node)

  node.connected = false
  node.connect = function (dest) {
    node.connected = true
    raw.connect(dest)
    return node
  }
  node.disconnect = function () {
    node.connected = false
    dispatch('disconnect', null, raw, dependents)
  }
  node.start = function (when, delay, duration) {
    var time = toTime(node.context, when, delay)
    if (!node.connected) node.connect(node.context.destination)
    dispatch('start', time, raw, dependents)
    if (duration) node.stop(time + duration)
    return node
  }
  node.stop = function (when, delay) {
    var time = toTime(node.context, when, delay)
    dispatch('stop', time, raw, dependents)
  }
  return node
}
