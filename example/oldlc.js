var wah = require('..')

Object.keys(wah).forEach(function (name) {
  console.log(name)
  window[name] = wah[name]
})

document.body.innerHTML = '<p>Open the development console</p>'
