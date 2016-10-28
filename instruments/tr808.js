var _ = require('..')

function snare () {
  return _.connect(_.white(), _.perc())
}

module.exports = {
  snare: snare
}
