import { swc } from '@jujulego/vite-plugin-swc';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

import pkg from './package.json' assert { type: 'json' };

/** @type {import('rollup').RollupOptions} */
const options = {
  input: ['src/main.ts', 'src/index.ts'],
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    nodeResolve({ exportConditions: ['node'] }),
    swc(),
    json()
  ],
  external: [
    ...(Object.keys(pkg.dependencies)),
    'react/jsx-runtime',
    'yargs/helpers',
  ],
};

export default options;