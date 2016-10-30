/**
 * This module provides two ways to route nodes:
 *
 * - In series: A -> B -> C -> D, using the `connect` function
 * - In parallel: in -> [A, B, C] -> out, using the `add` function
 * @module routing
 */
var slice = Array.prototype.slice
var isArray = Array.isArray

/**
 * Connect nodes in series: A -> B -> C -> D.
 * @param {Array<AudioNode>} nodes - the list of nodes to be connected
 * @return {AudioNode} the resulting audio node
 */
export function connect (nodes) {
  nodes = isArray(nodes) ? nodes : slice.call(arguments)
  if (!nodes.length) return null
  else if (nodes.length === 1) return nodes[0]

  var first = nodes[0]
  var last = nodes.reduce(function (src, dest) {
    src.connect(dest)
    return dest
  })
  first.connect = last.connect.bind(last)
  return lifecycle(first, nodes.slice(1))
}

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
  nodes.forEach(function (node) {
    if (node.numberOfInputs) input.connect(node)
    node.connect(output)
  })
  input.connect = output.connect.bind(output)
  return lifecycle(input, nodes)
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
    value.connect(node[name])
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
  var deps = dependents.filter(function (dep) {
    return dep && typeof dep.start === 'function'
  })
  if (deps.length) {
    var _start = node.start
    var _stop = node.stop
    node.start = function (time) {
      var res = _start ? _start.call(node, time) : void 0
      deps.forEach(function (d) { if (d.start) d.start(time) })
      return res
    }
    node.stop = function (time) {
      var res = _stop ? _stop.call(node, time) : void 0
      deps.forEach(function (d) { if (d.stop) d.stop(time) })
      return res
    }
  }
  return node
}
