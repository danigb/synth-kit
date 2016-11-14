# SynthKit

![stability](https://img.shields.io/badge/stability-experimental-red.svg?style=flat-square)

> A (web audio) synth construction kit

`synth-kit` is a collection of functions to make Web Audio API more enjoyable. Here is some taste of what you get:

```js
import { conn, sine, saw, lowpass, adsr, dest, master, inst } from 'synth-kit'

// start an OscillatorNode and connect it to AudioContext's destination
sine('C4').connect(dest()).start()
// start a chain of oscillator -> filter -> envelope -> destination
conn(saw('Db3'), lowpass(500), adsr(), dest()).start()

// start to master
master.start(conn(square('C4'), adsr()))

// create a instrument with an oscillator and an ADSR envelope:
var synth = inst(function (freq) {
  return conn(saw(freq), adsr())
})
synth.start('C4')
synth.start('G5')
synth.stop()

// create a substractive synth instrument with one oscillator:
var mono = inst(substract)
mono.start('C4')
// a substractive synth instrument with three sine oscillators
var duo = inst(substract, { oscillators: { ratios: [1, 2, 2.5 ] } })
duo.start({ note: 'C4', attack: 0.5 })
```

## Usage

#### Oscillators, buffers and sources

The `osc` function creates an OscillatorNode:

```js
osc({ note: 'C4', type: 'square' }).connect(dest()).start()
```

You can use any of its aliases: `sine`, `saw`, `triangle` or `square`:

```js
sine('Db3').connect(dest()).start()
```

You can load a sample with `load` function and play it with the `sample` function:

```js
var kick = load('http://myserver.com/samples/kick.mp3')
sample(kick).start()
```

Notice that the file must be fetched before get any sound, so if in the previous example `start` is called before loading the file, no sound in produced.


#### Filters and envelopes

Filters are created using `filter` function (or any of its aliases: `lowpass`, `hipass` and `bandpass`):

```js
saw(440).connect(lowpass(200)).start()
```

There are several types of envelopes. The typical `adsr(options)`:

```js
o = saw(440).connect(adsr({ release: 1 }))
o.start()
o.stop() // => will have 1 second of exponential decay
```

Or a percutive attack-decay envelope with `perc(attack, decay)`:

```js
o = saw(440).connect(perc()).start()
```

#### Routing

Routing audio unsing node's `connect` function is cumbersome, error prone and makes hard to understand the signal flow.

You can route nodes in series using the `conn(...nodes)` function:

```js
conn(sine(440), gain(0.5))
```

Or route them in parrallel using the `add(...nodes)` function:

```js
add(sine('c4'), sine('c5'), sine('g5'))
```

These two functions can be combined creating complex audio node graphs:

```js
// Add two sines and connect themm to a filter and an envelope
conn(add(sine(440), sine(444)), lowpass(500), adsr())

// Add two simple subtractive chain (osc -> filter -> adsr)
add(
  conn(saw(400), lowpass(800), perc()),
  conn(square(800), hipass(1000), adsr())
).connect(dest()).start()
```

#### Modulation

You can pass a node to any audio parameter value to create modulations. For example, you can modulate the `detune` parameter of an oscillator with another oscillator to create a vibrato effect:

```js
sine({ note: 'A4', detune: mul(50, sine(10)) }).start()
```

Or, for example, you can modulate a `gain` to create a tremolo effect:

```js
connect(saw('C4'), gain({ value: sine(4) })).start()
```

#### Synths

You can create a typical subtract synthetizer with an oscillator, a filter and two envelopes with the `subtract(freq, options)` function:

```js
subtractive(880, { type: 'square', filter: { type: 'hipass' } }).connect(dest()).start()
```

Or a prototypical additive synthetizer:

```js
additive([440, 880, 1200], { gains: [0.6, 0.3, 0.1] }).connect(dest()).start()
```

#### Instruments

Sometime you want a more OOP interface. You want a instrument:

```js
var marimba = inst(function (freq) {
  return add(
    conn(sine(fq), perc(0.1, 1)),
    conn(sine(2 * fq), perc(0.01, 0.1))
  )
})
marimba.start('C4')
marimba.start('G5')
marimba.stop()
```


#### Conversion and utility functions

SynthKit uses frequencies in hertzs to represent pitches, linear gain values to represent amplitudes and number of samples to represent buffer lengths. But sometimes you want to provide those using different units. Here are some conversion utilities:

- `noteToFreq(name)`: convert a note name or note midi number to its frequency
- `midiToFreq(midi)`: convert a note name or note midi number to its frequency
- `tempoToFreq(bpm, subdivision)`: convert from beats per minute to hertzs
- `dBToGain(db)`: convert from decibels to gain value
- `levelToGain(level)`: convert from level (0 to 100 in logaritmic scale) to gain value
- `gainToDb(gain)`: convert from gain to decibels
- `secsToSamples(num)`: convert from seconds to number of samples

## Livecoding in the browser

Setup `synth-kit` for live coding it's easy. Add the [distribution file] to you page:

And then:

```js
SynthKit.live() // => export all `synth-kit` functions to the global environment
sine(note('A4')).start()
```


## Test and examples

To view some examples open: `example/index.html`

## Inspiration and references

- The idea and API organization is taken from cljs-bach: https://github.com/ctford/cljs-bach Thanks ctford!
- Of course, the synth secrets tutorial was the beginning of all: https://github.com/micjamking/synth-secrets (that's a easy to read version). Thanks Gordon Reid (here it is an [awesome PDF version](http://www.mediafire.com/file/7w2dcsqmkbeduea/Synth+Secrets+Complete.pdf))
- Vincent made some nice 808 drum synsthesis: https://github.com/vincentriemer/io-808
- Percussion synthesis tutorial: http://www.cim.mcgill.ca/~clark/nordmodularbook/nm_percussion.html
- Sound Design in Web Audio its an awesome two part blog post: http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-1/ and http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-2/
- There are a lot of resources about synthesis, here is a nice one: https://www.gearslutz.com/board/electronic-music-instruments-electronic-music-production/460283-how-do-you-synthesize-808-ish-drums.html

## License

MIT License
