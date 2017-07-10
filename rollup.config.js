// rollup.config.js
// import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  dest: 'build/sequence-explorer.js',
  format: 'umd',
  moduleName: 'sequenceExplorer',
  globals: {
    'd3': 'd3',
    'd3-interpolate': 'd3',
    'd3-array': 'd3',
    'd3-scale': 'd3',
    'd3-collection': 'd3'
  },
  plugins: [
    /*
    nodeResolve({ 
      jsnext: true, 
      main: true}),
      */
      
    babel({
      exclude: 'node_modules/**'})
  ]
};