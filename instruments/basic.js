// Basic syntetizers
var Kit = require('..')

function ping (fq, opts) {
  opts = opts || {}
  fq = fq || 1000
  return Kit.conn(Kit.osc(opts.type, fq), Kit.perc(opts))
}

module.exports = { ping: ping }
