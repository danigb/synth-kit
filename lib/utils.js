export function isNum (n) { return typeof n === 'number' }
export function isFn (x) { return typeof x === 'function' }
export function isStr (x) { return typeof x === 'string' }
export function isObj (x) { return typeof x === 'object' }

// CONVERSION
// ==========

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
  // TODO: possible optimization: if dependents is empty, no need to decorate
  var raw = bindLifecycle(node)

  node.connected = false
  node.disconnect = function () {
    node.connected = false
    dispatch('disconnect', null, raw, dependents)
  }
  node.start = function (when, delay, duration) {
    var time = toTime(node.context, when, delay)
    // if (!node.connected) node.connect(node.context.destination)
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
