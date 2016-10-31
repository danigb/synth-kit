import { when } from './context'
import { slice, isArray } from './utils'

/**
 * This module provides two ways to route nodes:
 *
 * - In series: A -> B -> C -> D, using the `connect` function
 * - In parallel: in -> [A, B, C] -> out, using the `add` function
 * @module routing
 */

/**
 * Connect nodes in series: A -> B -> C -> D.
 * @param {Array<AudioNode>} nodes - the list of nodes to be connected
 * @return {AudioNode} the resulting audio node
 */
export function conn (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments)
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var node = nodes[0]
  if (!node.duration) node.duration = 0
  var last = nodes.reduce(function (src, dest) {
    src.connect(dest)
    node.duration = Math.max(node.duration, dest.duration || 0)
    return dest
  })
  setOutput(node, last)
  var startables = startable(nodes.slice(1))
  if (startables) {
    var _start = node.start
    node.start = function (time) {
      if (_start) _start.call(node, time)
      startables.forEach(function (node) { node.start(time) })
      if (node.duration) node.stop(time + node.duration)
    }
    var _stop = node.stop
    node.stop = function (time) {
      var t = 0
      startables.reverse()
      startables.forEach(function (node) {
        t = t || when(time, null, node.context)
        node.stop(t)
        t += node.release || 0
      })
      if (_stop) _stop.call(node, t)
    }
  }
  return node
}

// TODO: A RESOLVER: add debe tener onended cuando acaben todos sus nodos
/**
 * Connect nodes in parallel in order to add signals. This is one of the
 * routing functions (the other is `connect`).
 * @param {...AudioNode} nodes - the nodes to be connected
 * @return {AudioNode} the resulting audio node
 * @example
 * add(sine(400), sine(401)).start()
 */
export function add (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments)
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var context = nodes[0].context
  var input = context.createGain()
  var output = context.createGain()
  setOutput(input, output)
  nodes.forEach(function (node) {
    if (node.numberOfInputs) input.connect(node)
    node.connect(output)
  })
  var node = lifecycle(input, nodes)
  // fake onended when all onended is called
  var length = node.dependents.length
  function triggerEnded () {
    length--
    if (!length && node.onended) node.onended()
  }
  node.dependents.forEach(function (node) {
    node.onended = triggerEnded
  })
  return node
}

// TODO: better name
function setOutput (node, output) {
  node.output = node
  node.connect = function (dest) {
    output.connect(dest)
    return node
  }
  return node
}

/**
 * Given a list of nodes, return the ones that are startable
 * @private
 */
function startable (nodes) {
  return nodes.filter(function (dep) {
    return dep && typeof dep.start === 'function'
  })
}

/**
 * Plug something (a value, a node) into a node parameter
 * @param {String} name - the parameter name
 * @param {AudioNode|Object} value - the value (can be a signal)
 * @param {AudioNode} target - the target audio node
 * @return {AudioNode} the modulator signal if any or undefined
 * @private
 */
export function plug (name, value, node) {
  if (typeof value === 'undefined') {
    // do nothing
  } else if (typeof value.connect === 'function') {
    node[name].value = 0
    value.conn(node[name])
    return value
  } else if (node[name]) {
    node[name].value = value
  }
}

/**
 * Override start and stop functions (if necessary) to handle node dependencies
 * lifecycle.
 * @private
 */
export function lifecycle (node, dependents) {
  node.dependents = startable(dependents)
  if (node.dependents.length) {
    var _start = node.start
    var _stop = node.stop
    node.start = function (time) {
      var res = _start ? _start.call(node, time) : void 0
      node.dependents.forEach(function (d) { if (d.start) d.start(time) })
      if (node.start.then) node.start.then(time, node, dependents)
      return res
    }
    node.stop = function (time) {
      var res = _stop ? _stop.call(node, time) : void 0
      node.dependents.forEach(function (d) { if (d.stop) d.stop(time) })
      return res
    }
  }
  return node
}
