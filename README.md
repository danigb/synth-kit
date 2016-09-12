# synth-kit
> A (web audio) synth construction kit

## Quick start guide

So you want to write an audio synthetizer in javascript. Or learn how to sinthetize sounds. Or just make fun with some noise.

Let's try the simplest one:

```js
Square(300)
```

Let's add some elements:
```js
Connect(Saw(880), Lowpass(600), ADSR(0.01, 0.1, 0.8, 0.6))
```

Maybe you want to hear it (the second parameter of `start` its the duration):
```js
var synth = Connect(Saw(440), ADSR())
SynthKit(synth).start(null, 2)
```

Let's make a tremolo by modulating the gain with a square oscillator:

```js
Connect(Sine(400), Gain(Square(2)))
```

Or a vibrato (the second parameter of `Sine` is the `detune` option. Here we are detuning a tone, 100 cents):
```js
Sine(400, Mult(100, Sine(2)))
```

You can make reusable functions:
```js
var Tremolo = (tempo) => Gain(Square(tempoToHz(tempo)))
var MySynth = (note) => Connect(Saw(toHz(note)), Lowpass(toHz(note)), ADSR())
var MySnare = (tone) => Connect(White(), Lowpass(tone), Perc(0.2))
```

And combine them together:

```js
var sound = Add(
  Connect(MySynth('C4'), Tremelo(98)),
  Connect(MySnare(800), Reverb())
)
```

## Synth construction kit

Those are the functions currently implemented:

- Routing: Connect, Add, Destination
- Signals: Signal, Gain, Silence, Bypass, Pulse, Invert, Mult, Mod
- Oscillators: Osc, Sine, Saw, Square, Triangle
- Buffers: White
- Filters: Lowpass, Hipass, Bandpass
- Envelopes: ADSR, AD, Perc
- Effects: Mix, Reverb
- Waveshapers: SoftClip, HardClip
- Helpers: bpmToHz, audioToGain

Comming soon:

- Oscillators: PulseWave
- Effects: Delay, Tremolo, Overdrive
- Drums: kick, snare, cowbell, clave...
- Synths: Mono, Duo, FM

## Install

Coming soon to npm...

## Test and examples

`open exaple/index.html`

## Inspiration and references

- The idea and API organization comes from cljs-bach: https://github.com/ctford/cljs-bach Thanks ctford!
- Of course, the synth secrets tutorial was the beginning of all: https://github.com/micjamking/synth-secrets (that's a easy to read version). Thanks Gordon Reid
- Vincent made some nice 808 drum synsthesis: https://github.com/vincentriemer/io-808
- Percussion synthesis tutorial: http://www.cim.mcgill.ca/~clark/nordmodularbook/nm_percussion.html
- Sound Design in Web Audio its an awesome two part blog post: http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-1/ and http://nickwritesablog.com/sound-design-in-web-audio-neurofunk-bass-part-2/
- There are a lot of resources about synthesis, here is a nice one: https://www.gearslutz.com/board/electronic-music-instruments-electronic-music-production/460283-how-do-you-synthesize-808-ish-drums.html

## License

MIT License
