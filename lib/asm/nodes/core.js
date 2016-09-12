function isFn (x) { return typeof x === 'function' }

var Types = {
  gain: { type: 'number', units: 'gain' },
  oscType: { type: 'enum', values: ['sine', 'sawtooth', 'square', 'triangle'] },
  frequency: { type: 'number', units: 'hz' },
  detune: { type: 'number', units: 'cents' },
  filterType: { type: 'enum' },
  Q: { type: 'number' },
  buffer: { type: 'buffer' },
  curve: { type: 'function' },
  oversample: { type: 'enum', values: ['none', '2x', '4x'] },
  delay: { type: 'number', units: 'seconds' }
}

// MEMOIZE
// =======

export function Memoize (props) {
  if (!props.id) throw Error('Memoize must include an id')
  return function (ac) {
    var id = props.id
    if (!ac[id]) {
      ac[id] = props.node ? props.node(ac) : null
    }
    return ac[id]
  }
}

export function Destination (props) {
  return function (ac) { return ac.destination }
}

// BASIC NODES
// ===========
export var Gain = NodeBuilder('Gain', { gain: Types.gain }, { gain: 1 })

export var Oscillator = NodeBuilder('Oscillator',
  { type: Types.oscType, frequency: Types.frequency, detune: Types.detune },
  { type: 'sine', frequency: 440, detune: 0 })

export var BiquadFilter = NodeBuilder('BiquadFilter',
  { type: Types.filterType, frequency: Types.frequency, Q: Types.Q },
  { type: 'lowpass', frequency: 5000, Q: 1 })

export var BufferSource = NodeBuilder('BufferSource',
 { buffer: Types.buffer, loop: Types.loop, detune: Types.detune },
 { buffer: null, loop: false, detune: 0 })

export function Convolver (props) {
  return Node('Convolver', props)
}
Convolver.propTypes = { buffer: Types.buffer, normalize: Types.normalize }
Convolver.defaultProps = { buffer: null, normalize: false }

export function WaveShaper (props) {
  return Node('WaveShaper', props)
}
WaveShaper.propTypes = { curve: Types.curve, oversample: Types.oversample }
WaveShaper.defaultProps = { curve: undefined, oversample: 'none' }

export function Delay (props) {
  return Node(function (ac) {
    return ac.createDelay(props.maxDelay || props.delayTime || 1)
  }, props)
}
Delay.propTypes = {
  maxDelay: Types.delay,
  delayTime: Types.delay
}

function Node (name, props) {
  return function (ac) {
    var node = isFn(name) ? name(ac) : ac['create' + name]()
    return plugProps(ac, node, props)
  }
}

function plugProps (ac, node, props) {
  var value, modulator
  Object.keys(props).forEach(function (propName) {
    value = props[propName]
    switch (typeof value) {
      case 'undefined':
        break // do nothing
      case 'function':
        modulator = value(ac)
        node.nodes = node.nodes || []
        node.nodes.push(modulator)
        plug(propName, modulator, node)
        break
      default:
        plug(propName, value, node)
    }
  })
  return node
}

function NodeBuilder (name, propTypes, defaultProps) {
  function builder (props) {
    return function (ac) {
      var value, modulator
      var node = ac['create' + name]()
      console.log('PROPS', props)
      Object.keys(props).forEach(function (propName) {
        value = props[propName]
        switch (typeof value) {
          case 'undefined':
            break // do nothing
          case 'function':
            modulator = value(ac)
            console.log('modulator', modulator)
            node.nodes = node.nodes || []
            node.nodes.push(modulator)
            plug(propName, modulator, node)
            break
          default:
            plug(propName, value, node)
        }
      })
      return node
    }
  }
  builder.propTypes = propTypes
  builder.defaultProps = defaultProps
  return builder
}

function plug (propName, value, node) {
  var target = node[propName]
  if (isFn(value.connect)) {
    target.value = 1
    value.connect(target)
  } else if (target && typeof target.value !== 'undefined') target.value = value
  else node[propName] = value
}
