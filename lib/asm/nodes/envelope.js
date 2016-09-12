function noop () {}

var Types = {
  contour: { type: 'array' }
}

/**
 * Create an envelope. An envelope is a node with with two funtions: attack
 * and release.
 */
export function Envelope (props) {
  return function (ac) {
    var env = ac.createGain()
    env.attack = applyEnvelope(ac, env.gain, props.attack)
    env.release = applyEnvelope(ac, env.gain, props.release)
    env.duration = durationOf(props.attack)
    env.releaseDuration = durationOf(props.release)
    return env
  }
}
Envelope.propTypes = {
  attack: Types.contour,
  release: Types.contour
}
Envelope.defaultProps = { attack: [], release: [] }

var EnvTypes = {
  set: 'setValueAtTime',
  lin: 'linearRampToValueAtTime',
  exp: 'exponentialRampToValueAtTime'
}
function applyEnvelope (ac, param, ramps) {
  if (!ramps || ramps.length === 0) return noop
  return function (when) {
    var time = Math.max(ac.currentTime, when || 0)
    each(ramps, function (type, value, dur) {
      var fn = EnvTypes[type] || EnvTypes['lin']
      if (value === 0 && type === 'exp') value = 0.00001
      time += dur
      param[fn](value, time)
    })
  }
}

function durationOf (ramps) {
  var total = 0
  each(ramps, function (type, value, dur) { total += dur })
  return total
}

function each (ramps, cb) {
  if (!ramps) return 0
  var len = ramps.length
  for (var i = 0; i < len; i += 3) {
    cb(ramps[i], ramps[i + 1], ramps[i + 2], i)
  }
}
