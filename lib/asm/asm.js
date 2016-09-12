import * as Nodes from './nodes'
var isArray = Array.isArray
function noOp () {}
function isFn (x) { return typeof x === 'function' }
function isStr (x) { return typeof x === 'string' }
var EMPTY_OBJ = {}

export default function Asm (graph) {
  var synth
  if (isGraph(graph)) synth = parseGraph(graph[0], Object.assign({}, graph[1]))
  else if (isFn(graph)) synth = graph
  else throw Error('Not valid graph: ' + graph)

  return function (ac, dest) {
    var node = synth(ac)
    addConnect(node)
    addLifecycle(ac, node)

    if (dest === true) node.connect(ac.destination)
    else if (dest) node.connect(dest)
    return node
  }
}
Asm.builders = Nodes

function isGraph (g) {
  return isArray(g) && g.length === 2 && isStr(g[0])
}

function parseGraph (name, props) {
  props = props || EMPTY_OBJ
  // recursively parse all the graphs from the options object
  Object.keys(props).forEach(function (propName) {
    var prop = props[propName]
    if (isGraph(prop)) props[propName] = parseGraph(prop[0], prop[1])
    else if (isFn(prop)) props[propName] = prop
    else if (isArray(prop)) {
      props[propName] = prop.map(function (prop) {
        return isGraph(prop) ? parseGraph(prop[0], prop[1]) : prop
      })
    }
  })
  if (!Asm.builders[name]) throw Error('Builder not found: ' + name)
  return Asm.builders[name](props)
}

function addConnect (node) {
  var _connect = node.connect
  node.connect = function (dest) {
    _connect.call(node, dest)
    return node
  }
}

function addLifecycle (ac, node) {
  var _start = node.start || noOp
  node.start = function (when, dur) {
    var time = Math.max(ac.currentTime, (when || 0))
    trigger('attack', time, node)
    _start.call(node, time)
    trigger('start', time, node.nodes)

    var duration = dur || node.duration
    if (duration) node.stop(time + duration)
    return node
  }
  var _stop = node.stop || noOp
  node.stop = function (when) {
    var releaseAt = Math.max(ac.currentTime, (when || 0))
    trigger('release', releaseAt, node)

    var stopAt = releaseAt + (node.releaseDuration || 0)
    _stop.call(node, stopAt)
    trigger('stop', stopAt, node.nodes)

    var disconnectAfter = stopAt - ac.currentTime
    setTimeout(function () {
      trigger('disconnect', null, node)
    }, disconnectAfter * 1000 + 1000)
  }
  return node
}

function trigger (event, time, node) {
  if (!node) {
  } else if (isArray(node)) {
    node.forEach(function (n) { trigger(event, time, n) })
  } else {
    if (node[event]) node[event](time)
    if (node.nodes) trigger(event, time, node.nodes)
  }
}
