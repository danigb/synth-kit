## Members

<dl>
<dt><a href="#after">after</a> ⇒ <code>Float</code></dt>
<dd><p>Get time after n seconds (from now)</p>
</dd>
<dt><a href="#master">master</a></dt>
<dd><p>A master output instrument. You can start nodes with it</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#sample">sample(url, context)</a> ⇒ <code>function</code></dt>
<dd><p>Get a remote audio sample. You get a function that returns an AudioBuffer
when loaded or null otherwise. Or you can chain like a promise.</p>
</dd>
<dt><a href="#source">source(buffer, loop, detune, context)</a> ⇒ <code>AudioNode</code></dt>
<dd><p>Create a buffer source node.</p>
</dd>
<dt><a href="#generate">generate(generators, samples, reverse)</a> ⇒ <code>function</code></dt>
<dd><p>Generate a BufferNode. It returns a no-parameter function that
returns a buffer. This way, it&#39;s easy to memoize (cache) buffers.</p>
</dd>
<dt><a href="#white">white(length, loop, context)</a> ⇒ <code>AudioNode</code></dt>
<dd><p>White noise source node.</p>
</dd>
<dt><a href="#context">context()</a></dt>
<dd><p>Get the audio context</p>
</dd>
<dt><a href="#contextOf">contextOf()</a></dt>
<dd><p>Get the audio context of an audio node</p>
</dd>
<dt><a href="#dest">dest()</a></dt>
<dd><p>Get the audio context&#39;s destination</p>
</dd>
<dt><a href="#now">now()</a></dt>
<dd><p>Get audio context&#39;s current time</p>
</dd>
<dt><a href="#when">when(time, delay, context)</a></dt>
<dd><p>Get a valid time</p>
</dd>
<dt><a href="#samplingRate">samplingRate(context)</a> ⇒ <code>Integer</code></dt>
<dd><p>Get audio context sampling rate</p>
</dd>
<dt><a href="#seconds">seconds(seconds, context)</a> ⇒ <code>Integer</code></dt>
<dd><p>Convert from seconds to samples (using AudioContext sampling rate)</p>
</dd>
<dt><a href="#connect">connect(nodes)</a> ⇒ <code>AudioNode</code></dt>
<dd><p>Connect nodes in series: A -&gt; B -&gt; C -&gt; D</p>
</dd>
<dt><a href="#add">add()</a></dt>
<dd><p>Connect nodes in parallel</p>
</dd>
<dt><a href="#constant">constant(value)</a> ⇒ <code>AudioNode</code></dt>
<dd><p>Create a constant signal</p>
</dd>
<dt><a href="#bypass">bypass(context)</a> ⇒ <code>AudioNode</code></dt>
<dd><p>Create a node that bypasses the signal</p>
</dd>
<dt><a href="#gain">gain()</a></dt>
<dd><p>Create a gain</p>
</dd>
<dt><a href="#mult">mult()</a></dt>
<dd><p>Multiply a signal</p>
</dd>
<dt><a href="#scale">scale()</a></dt>
<dd><p>Scale a signal</p>
</dd>
<dt><a href="#osc">osc()</a></dt>
<dd><p>Create an oscillator</p>
</dd>
<dt><a href="#oscBank">oscBank()</a></dt>
<dd><p>Create an oscillator bank</p>
</dd>
<dt><a href="#filter">filter()</a></dt>
<dd><p>Create a filter</p>
</dd>
<dt><a href="#detune">detune()</a></dt>
<dd><p>Detune modulator. Can be connected to any <code>detune</code> param.
Basically is a boilerplate code</p>
</dd>
<dt><a href="#feedback">feedback(amount, node, ret, context)</a></dt>
<dd><p>Create a feedback loop.</p>
</dd>
<dt><a href="#adshr">adshr()</a></dt>
<dd><p>An attack-decay-sustain-(hold)-decay envelope</p>
</dd>
<dt><a href="#perc">perc()</a></dt>
<dd><p>An attack-decay envelope</p>
</dd>
<dt><a href="#withNotes">withNotes()</a></dt>
<dd></dd>
<dt><a href="#withOptions">withOptions()</a></dt>
<dd></dd>
<dt><a href="#inst">inst()</a></dt>
<dd></dd>
<dt><a href="#load">load(url, context)</a> ⇒ <code>Promise.&lt;AudioBuffer&gt;</code></dt>
<dd><p>Load a remote audio file.</p>
</dd>
<dt><a href="#fetch">fetch(url, type)</a> ⇒ <code>Promise</code></dt>
<dd><p>Fetch url</p>
</dd>
<dt><a href="#tempo">tempo(bpm, sub)</a> ⇒ <code>Float</code></dt>
<dd><p>Convert from beats per minute to hertzs</p>
</dd>
<dt><a href="#note">note()</a></dt>
<dd><p>Get frequency of a note. The note can be a note name in scientific
notation (for example: &#39;C#2&#39;) or a midi number</p>
</dd>
<dt><a href="#plug">plug()</a></dt>
<dd><p>Plug something (a value, a node) into a node parameter</p>
</dd>
<dt><a href="#lifecycle">lifecycle()</a></dt>
<dd><p>Override node functions to handle better the node&#39;s lifecycle</p>
</dd>
</dl>

<a name="after"></a>

## after ⇒ <code>Float</code>
Get time after n seconds (from now)

**Kind**: global variable  
**Returns**: <code>Float</code> - time in seconds  

| Param | Type | Description |
| --- | --- | --- |
| delay | <code>Float</code> | the delay |
| context | <code>AudioContext</code> | (Optional) the audio context |

**Example**  
```js
now() // => 0.785
after(1) // => 1.785
```
<a name="master"></a>

## master
A master output instrument. You can start nodes with it

**Kind**: global variable  
**Example**  
```js
master.start(sine(300))
```
<a name="sample"></a>

## sample(url, context) ⇒ <code>function</code>
Get a remote audio sample. You get a function that returns an AudioBuffer
when loaded or null otherwise. Or you can chain like a promise.

**Kind**: global function  
**Returns**: <code>function</code> - a function the returns the buffer  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | the url of the file |
| context | <code>AudioContext</code> | (Optional) the audio context |

**Example**  
```js
source(sample('server.com/audio-file.mp3')).start()
```
**Example**  
```js
// use the Promise like interface
sample('audio-file.mp3').then(function (buffer) {
    source(buffer).start()
})
```
<a name="source"></a>

## source(buffer, loop, detune, context) ⇒ <code>AudioNode</code>
Create a buffer source node.

**Kind**: global function  
**Returns**: <code>AudioNode</code> - BufferSourceNode  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>Buffer</code> &#124; <code>function</code> | the buffer (or a function that returns a buffer) |
| loop | <code>Boolean</code> | (Optional) loop the buffer or not (defaults to false) |
| detune | <code>Integer</code> &#124; <code>Node</code> | (Optional) the detune value or modulator |
| context | <code>AudioContext</code> | (Optional) the audio context |

<a name="generate"></a>

## generate(generators, samples, reverse) ⇒ <code>function</code>
Generate a BufferNode. It returns a no-parameter function that
returns a buffer. This way, it's easy to memoize (cache) buffers.

**Kind**: global function  
**Returns**: <code>function</code> - a function with no parameters that returns the desired buffer  

| Param | Type | Description |
| --- | --- | --- |
| generators | <code>function</code> &#124; <code>Array.&lt;function()&gt;</code> | a generator or a list of generators (to create a buffer with multiple channels) |
| samples | <code>Integer</code> | the length in samples |
| reverse | <code>Boolean</code> | (Optional) true if you want the buffer reversed |

<a name="white"></a>

## white(length, loop, context) ⇒ <code>AudioNode</code>
White noise source node.

**Kind**: global function  
**Returns**: <code>AudioNode</code> - the white noise audio node generator  

| Param | Type | Description |
| --- | --- | --- |
| length | <code>Integer</code> | lenth in samples |
| loop | <code>Boolean</code> | (Optional) infinite duration |
| context | <code>AudioContext</code> | (Optional) audio context |

**Example**  
```js
connect(white(seconds(1)), perc(), dest()).start()
```
<a name="context"></a>

## context()
Get the audio context

**Kind**: global function  
<a name="contextOf"></a>

## contextOf()
Get the audio context of an audio node

**Kind**: global function  
<a name="dest"></a>

## dest()
Get the audio context's destination

**Kind**: global function  
<a name="now"></a>

## now()
Get audio context's current time

**Kind**: global function  
<a name="when"></a>

## when(time, delay, context)
Get a valid time

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| time | <code>Float</code> | the time (equal or greater than now(), otherwise, ignored) |
| delay | <code>Float</code> | the delay |
| context | <code>AudioContext</code> | (Optional) the audio context |

**Example**  
```js
now() // => 0.7
time(0.2) // => 0.7
time(1) // => 1
time(0.2, 1) // => 1.7 (time is ignored because is < than now())
```
<a name="samplingRate"></a>

## samplingRate(context) ⇒ <code>Integer</code>
Get audio context sampling rate

**Kind**: global function  
**Returns**: <code>Integer</code> - the context's sampling rate  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>AudioContext</code> | (Optional) the audio context |

**Example**  
```js
samplingRate() // => 44100
```
<a name="seconds"></a>

## seconds(seconds, context) ⇒ <code>Integer</code>
Convert from seconds to samples (using AudioContext sampling rate)

**Kind**: global function  
**Returns**: <code>Integer</code> - the number of samples  

| Param | Type | Description |
| --- | --- | --- |
| seconds | <code>Float</code> | the number of seconds |
| context | <code>AudioContext</code> | (Optional) the audio context |

**Example**  
```js
white(seconds(1.2)) // => generate 1.2 seconds of white noise
```
<a name="connect"></a>

## connect(nodes) ⇒ <code>AudioNode</code>
Connect nodes in series: A -> B -> C -> D

**Kind**: global function  
**Returns**: <code>AudioNode</code> - the resulting audio node  

| Param | Type | Description |
| --- | --- | --- |
| nodes | <code>Array.&lt;AudioNode&gt;</code> | the list of nodes to be connected |

<a name="add"></a>

## add()
Connect nodes in parallel

**Kind**: global function  
<a name="constant"></a>

## constant(value) ⇒ <code>AudioNode</code>
Create a constant signal

**Kind**: global function  
**Returns**: <code>AudioNode</code> - the audio node  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>Integer</code> | the value of the constant |

<a name="bypass"></a>

## bypass(context) ⇒ <code>AudioNode</code>
Create a node that bypasses the signal

**Kind**: global function  
**Returns**: <code>AudioNode</code> - the bypass audio node  

| Param | Type | Description |
| --- | --- | --- |
| context | <code>AudioContext</code> | (Optional) the audio context |

<a name="gain"></a>

## gain()
Create a gain

**Kind**: global function  
<a name="mult"></a>

## mult()
Multiply a signal

**Kind**: global function  
<a name="scale"></a>

## scale()
Scale a signal

**Kind**: global function  
<a name="osc"></a>

## osc()
Create an oscillator

**Kind**: global function  
<a name="oscBank"></a>

## oscBank()
Create an oscillator bank

**Kind**: global function  
<a name="filter"></a>

## filter()
Create a filter

**Kind**: global function  
<a name="detune"></a>

## detune()
Detune modulator. Can be connected to any `detune` param.
Basically is a boilerplate code

**Kind**: global function  
**Example**  
```js
sine(300, detune(200, adshr(0.1, 0.2, 0.5, 1))))
sine(300, detune(50, tempo(20)))
```
<a name="feedback"></a>

## feedback(amount, node, ret, context)
Create a feedback loop.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| amount | <code>Integer</code> | the amount of signal |
| node | <code>AudioNode</code> | the node to feedback |
| ret | <code>AudioNode</code> | (Optional) the return fx |
| context | <code>AudioContext</code> | (Optional) the audio context |

<a name="adshr"></a>

## adshr()
An attack-decay-sustain-(hold)-decay envelope

**Kind**: global function  
<a name="perc"></a>

## perc()
An attack-decay envelope

**Kind**: global function  
<a name="withNotes"></a>

## withNotes()
**Kind**: global function  
**Example**  
```js
var synth = withNotes((fq) => return sine(fq))
synth('A4') // => play a 440Hz sound
synth(60) // => same as: play('C4')
```
<a name="withOptions"></a>

## withOptions()
**Kind**: global function  
**Example**  
```js
var synth = withOptions(function (o) {
   return connect(sine(o.frequency),
     filter(o.filter.type, o.filter.frequency || o.frequency))
}, { frequency: 440, filter: { type: 'lowpass' }}, ['frequency'])
synth({ frequency: 'A4' })
synth('A4')
```
<a name="inst"></a>

## inst()
**Kind**: global function  
**Example**  
```js
// an instrument with destination
var synth = inst((fq) => sine(fq), dest())
synth.start('A4')
synth.stopAll()
```
**Example**  
```js
// only the destination
var master = inst(null, connect(mix(0.2), reverb(), dest()))
master.start(sine(300))
master.start(sine(400))
master.stopAll()
```
<a name="load"></a>

## load(url, context) ⇒ <code>Promise.&lt;AudioBuffer&gt;</code>
Load a remote audio file.

**Kind**: global function  
**Returns**: <code>Promise.&lt;AudioBuffer&gt;</code> - a promise that resolves to an AudioBuffer  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> |  |
| context | <code>AudioContext</code> | (Optional) |

<a name="fetch"></a>

## fetch(url, type) ⇒ <code>Promise</code>
Fetch url

**Kind**: global function  
**Returns**: <code>Promise</code> - a promise to the result  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | the url |
| type | <code>String</code> | can be 'text' or 'arraybuffer' |

<a name="tempo"></a>

## tempo(bpm, sub) ⇒ <code>Float</code>
Convert from beats per minute to hertzs

**Kind**: global function  
**Returns**: <code>Float</code> - the tempo expressed in hertzs  

| Param | Type | Description |
| --- | --- | --- |
| bpm | <code>Integer</code> | the tempo |
| sub | <code>Integer</code> | (Optional) subdivision (default 1) |

<a name="note"></a>

## note()
Get frequency of a note. The note can be a note name in scientific
notation (for example: 'C#2') or a midi number

**Kind**: global function  
<a name="plug"></a>

## plug()
Plug something (a value, a node) into a node parameter

**Kind**: global function  
<a name="lifecycle"></a>

## lifecycle()
Override node functions to handle better the node's lifecycle

**Kind**: global function  
