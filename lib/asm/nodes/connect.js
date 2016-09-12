var EMPTY = []

/**
 * Create a connection between nodes. Connections can be in serial or in parallel.
 */
export function Connect (props) {
  return function (ac) {
    var nodes = props.nodes.map(initWith(ac)) || EMPTY
    if (nodes.length === 0) return ac.createGain()
    else if (nodes.length === 1) return nodes[0]

    var isSerial = props.type !== 'parallel'
    var node = isSerial ? serial(ac, nodes) : parallel(ac, nodes)
    node.nodes = nodes
    node.duration = isSerial ? maxOf('duration', nodes) : maxIfAll('duration', nodes)
    node.releaseDuration = maxOf('releaseDuration', nodes)
    return node
  }
}
Connect.propTypes = {
  type: { type: 'enum', values: ['serial', 'parallel'] },
  feedback: { type: 'number', units: 'gain' },
  nodes: { type: 'array' }
}
Connect.defaultProps = { type: 'serial', nodes: EMPTY }

// PRIVATE FUNCTIONS
// =================
function initWith (ac) { return function (synth) { return synth(ac) } }

function serial (ac, nodes) {
  var serial = ac.createGain()
  var last = nodes.reduce(function (src, dest) {
    if (dest.numberOfInputs) src.connect(dest)
    return dest
  }, serial)
  serial.connect = last.connect.bind(last)
  return serial
}

function parallel (ac, nodes) {
  var parallel = ac.createGain()
  var output = ac.createGain()
  nodes.forEach(function (node) {
    if (node.numberOfInputs) parallel.connect(node)
    node.connect(output)
  })
  nodes.push(output) // add to the life cycle controlled nodes
  parallel.connect = output.connect.bind(output)
  return parallel
}

function maxOf (prop, list) {
  return list.reduce(function (memo, o) {
    return Math.max(memo, o[prop] || 0)
  }, 0)
}
function maxIfAll (prop, list) {
  return list.reduce(function (memo, o) {
    return memo && o[prop] ? Math.max(memo, o[prop]) : null
  }, 0.0001)
}
