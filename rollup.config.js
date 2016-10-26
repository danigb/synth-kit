import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'lib/index.js',
  plugins: [
    nodeResolve({ jsnext: true, main: true }),
    commonjs()
  ],
  dest: 'dist/synth-kit.js',
  moduleName: 'SynthKit',
  format: 'umd'
}
