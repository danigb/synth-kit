# SynthKit

![stability](https://img.shields.io/badge/stability-experimental-red.svg?style=flat-square)

> A (web audio) synth construction kit

`synth-kit` is a little collection of functions to make Web Audio API more enjoyable. Some examples:

```js
import { connect, add, sine, saw, lowpass, gain, adsr } from 'synth-kit'

sine(440).start()
connect(saw(1200), lowpass(500), adsr()).start()
add(sine(800), connect(sine(1600), gain(0.5))).start()

```

## Usage

#### Oscillators

The `osc(type, freq, detune)` function creates an OscillatorNode:

```js
osc('sawtooth', 880).start()
```

You can use any of its aliases: `sine`, `saw`, `triangle` or `square`:

```js
sine(440).start()
```

#### Buffers and BufferSources

You can load a buffer with `load(url)` and play it with `sample(buffer, loop, detune)`:

```js
var buffer = load('http://myserver.com/samples/kick.mp3')
sample(buffer).start()
```

Notice that `load` will return a _function that creates a buffer_ (although you can pass it directly to the `sample` function as a buffer parameter). This is because the function returned from load will in turn return an empty buffer until the sound is loaded.

You can use the `loadAll(baseUrl, names, ext)` to load more than a buffer:

```js
var buffers = loadAll('https://danigb.github.io/sampled/MRK-2/samples', ['snare', 'kick', 'block'], '.wav')
sample(buffers['kick']).start()
```

As you can see by the examples, this is fully compatible with [sampled](https://github.com/danigb/sampled) repository.

#### Gain and Filters

You can use the `gain(amount)` function to create a GainNode:

```js
sine(300).connect(gain(0.2)).start()
```

BiquadFilterNodes are created using `filter(type, freq, Q, detune)` function (or any of its aliases: `lowpass`, `hipass` and `bandpass`):

```js
saw(440).connect(lowpass(200)).start()
```

#### Routing

Routing audio nodes unsing `connect` function is cumbersome, error prone and makes hard to understand the signal flow.

Normally you will want to route nodes in series using the `connect(...nodes)` function:

```js
connect(sine(440), gain(0.5))
```

Or route them in parrallel using the `add(...nodes)` function:

```js
add(sine(440), sine(880))
```

These two functions can be combined in any complex way:

```js
connect(
  add(
    saw(440),
    connect(saw(442), gain(0.4))
  ), lowpass(350), adsr())
```

#### Modulation

You can pass a node to any audio parameter value to create modulations. For example, you can modulate the `detune` parameter of an oscillator with another oscillator to create a vibrato effect:

```js
// the second argument is the sine detune parameter
sine(440, mul(50, sine(10))).start()
// Although there is an utility function for that:
sine(440, detune(50, 10)).start()
```

Or, for example, you can modulate a `gain` to create a tremolo effect:

```js
connect(saw(440), gain(sine(15))).start()
// and there's also a function for that:
connect(saw(440), tremolo(15)).start()
```

#### Reusing

Since OscillatorNodes and BufferSourceNodes are _single-shot_ usage, you can't call `start` twice on the same object:

```js
var synth = connect(saw(300), adsr())
o.start()
o.start() // error
```

The way to solve this limitation is by wrapping the synth definition in a function:

```js
// a one oscillator synth
function mono (freq) {
  return connect(saw(freq), adsr())
}
mono(440).start()
mono(880).start()
```

Again, those can be composed in larger structures:

```js
// a two oscillator synth
function duo (freq) {
  return add(mono(freq), mono(freq * 2.05))
}
duo(440).start()
duo(note('C4')).start()
```

#### Envelopes

#### Effects

#### Conversion and utility functions

SynthKit uses frequencies in hertzs to represent pitches, linear gain values to represent amplitudes and number of samples to represent buffer lengths. But sometimes you want to provide those using different units. Here are some conversion utilities:

- `tempo(bpm, subdivision)`: convert from beats per minute to hertzs
- `note(name or midi)`: convert a note name or note midi number to its frequency
- `db(num)`: convert from decibels to gain value
- `level(num)`: convert from level (0 to 100 in logaritmic scale) to gain value
- `secs(num)`: convert from seconds to number of samples

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
