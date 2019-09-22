import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import * as fs from 'fs';
import {join} from 'path';

const globals = {
  rxjs: 'rxjs',
  'rxjs/operators': ['rxjs.operators'],
  '@aloreljs/rxutils': "window['@aloreljs/rxutils']",
  '@aloreljs/rxutils/operators': "window['@aloreljs/rxutils'].operators",
  lodash: '_',
  'lodash-es': '_'
};

export default {
  input: 'src/index.ts',
  external: Object.keys(globals),
  output: {
    banner: () => fs.readFileSync(join(__dirname, 'bundle.meta.js'), 'utf8'),
    file: 'bundle.user.js',
    format: 'iife',
    globals
  },
  plugins: [
    resolve({
      mainFields: ['fesm5', 'esm5', 'module', 'browser', 'main'],
      extensions: ['.js', '.ts', '.mjs', '.json']
    }),
    typescript({
      allowNonTsExtensions: true
    })
  ]
}
