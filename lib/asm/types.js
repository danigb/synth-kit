export var Types = {
  route: { type: 'enum', values: ['serial', 'parallel'] },
  nodes: { type: 'array' },
  gain: { type: 'number' },
  oscType: { type: 'enum', values: ['sine'] },
  frequency: { type: 'number' },
  detune: { type: 'number' },
  filterType: { type: 'enum' },
  Q: { type: 'number' },
  contour: { type: 'array' },
  sampleRate: { type: 'number' },
  numOfChannels: { },
  normalize: { type: 'boolean' }
}
